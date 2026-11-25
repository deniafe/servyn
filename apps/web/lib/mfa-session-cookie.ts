import "server-only";

export const MFA_ENROLLED_COOKIE = "sv_mfa_enrolled";
export const MFA_ENROLLED_TTL_MS = 60 * 60 * 1000;

const encoder = new TextEncoder();

async function computeHmacHex(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function signMfaEnrolledToken(
  userId: string,
  sessionId: string,
  options: { nowMs?: number; ttlMs?: number } = {},
): Promise<string> {
  const secret = process.env["CLERK_SECRET_KEY"];
  if (!secret) {
    throw new Error("CLERK_SECRET_KEY is required to sign MFA enrollment proof");
  }
  const nowMs = options.nowMs ?? Date.now();
  const ttlMs = options.ttlMs ?? MFA_ENROLLED_TTL_MS;
  const exp = nowMs + ttlMs;
  const sig = await computeHmacHex(`${userId}:${sessionId}:${exp}`, secret);
  return `${userId}.${sessionId}.${exp}.${sig}`;
}

export async function verifyMfaEnrolledToken(
  token: string | undefined,
  userId: string | null | undefined,
  sessionId: string | null | undefined,
  nowMs: number = Date.now(),
): Promise<boolean> {
  if (!token || !userId || !sessionId) return false;
  const secret = process.env["CLERK_SECRET_KEY"];
  if (!secret) return false;

  const parts = token.split(".");
  if (parts.length !== 4) return false;

  const [tokenUserId, tokenSessionId, tokenExpRaw, tokenSig] = parts;
  if (!tokenUserId || !tokenSessionId || !tokenExpRaw || !tokenSig) return false;
  if (tokenUserId !== userId || tokenSessionId !== sessionId) return false;

  const exp = Number(tokenExpRaw);
  if (!Number.isFinite(exp) || nowMs > exp) return false;

  const expectedSig = await computeHmacHex(`${userId}:${sessionId}:${exp}`, secret);
  return constantTimeEqual(tokenSig, expectedSig);
}
