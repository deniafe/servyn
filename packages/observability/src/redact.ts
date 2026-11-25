export const REDACTED = "[REDACTED]" as const;

const MAX_DEPTH = 8;

const SENSITIVE_KEY_FRAGMENTS = [
  "password",
  "passwd",
  "secret",
  "token",
  "apikey",
  "api_key",
  "authorization",
  "cookie",
  "set-cookie",
  "card",
  "cvc",
  "cvv",
  "pan",
  "iban",
  "sort_code",
  "account_number",
  "dbs",
  "signedurl",
  "signed_url",
  "chat_content",
  "message_body",
  "phone",
  "address",
] as const;

const BEARER_RE = /\bBearer\s+[A-Za-z0-9\-._~+/]+=*/gi;
const KEY_PREFIX_RE = /\b(?:sk_live|sk_test|pk_live|pk_test|whsec|re|sk-ant|sk-proj)_[A-Za-z0-9\-_]{6,}\b|\b(?:sk-ant-|sk-proj-|re_)[A-Za-z0-9\-_]{8,}\b/g;
const CARD_DIGITS_RE = /\b\d(?:[ -]?\d){12,18}\b/g;
const PRESIGNED_QUERY_RE = /([?&](?:X-Amz-Signature|X-Amz-Credential|X-Amz-Security-Token|Signature)=)[^&\s]+/gi;
const EMAIL_RE = /\b([A-Za-z0-9._%+-])[A-Za-z0-9._%+-]*@([A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/g;

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return SENSITIVE_KEY_FRAGMENTS.some((fragment) => normalized.includes(fragment));
}

export function redactString(input: string): string {
  return input
    .replace(BEARER_RE, `Bearer ${REDACTED}`)
    .replace(KEY_PREFIX_RE, REDACTED)
    .replace(PRESIGNED_QUERY_RE, `$1${REDACTED}`)
    .replace(CARD_DIGITS_RE, (match) => {
      const digitsOnly = match.replace(/[^0-9]/g, "");
      return digitsOnly.length >= 13 && digitsOnly.length <= 19 ? REDACTED : match;
    })
    .replace(EMAIL_RE, (_m, firstChar: string, domain: string) => `${firstChar}***@${domain}`);
}

export function redactValue(
  value: unknown,
  depth = 0,
  seen: WeakSet<object> = new WeakSet(),
): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return redactString(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();

  if (depth >= MAX_DEPTH) {
    return "[MAX_DEPTH]";
  }

  if (value instanceof Error) {
    const out: Record<string, unknown> = {
      name: value.name,
      message: redactString(value.message),
    };
    const maybeCode = (value as { code?: unknown }).code;
    if (typeof maybeCode === "string" || typeof maybeCode === "number") {
      out["code"] = maybeCode;
    }
    return out;
  }

  if (typeof value !== "object") {
    return typeof value === "symbol" ? value.toString() : "[UNSERIALISABLE]";
  }

  if (seen.has(value)) {
    return "[CIRCULAR]";
  }
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, depth + 1, seen));
  }

  const record = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(record)) {
    if (isSensitiveKey(key)) {
      result[key] = REDACTED;
      continue;
    }
    if (
      key.toLowerCase() === "body" &&
      ("chat" in record || "conversationId" in record || "messageId" in record)
    ) {
      result[key] = REDACTED;
      continue;
    }
    result[key] = redactValue(entry, depth + 1, seen);
  }

  return result;
}

export function redactSentryEvent<T extends Record<string, unknown>>(event: T): T {
  const cloned = { ...event } as Record<string, unknown>;

  if (cloned["user"] && typeof cloned["user"] === "object") {
    const u = cloned["user"] as Record<string, unknown>;
    cloned["user"] = typeof u["id"] === "string" || typeof u["id"] === "number" ? { id: u["id"] } : {};
  }

  if (cloned["request"] && typeof cloned["request"] === "object") {
    const req = { ...(cloned["request"] as Record<string, unknown>) };
    if ("headers" in req) req["headers"] = REDACTED;
    if ("cookies" in req) req["cookies"] = REDACTED;
    if ("data" in req) req["data"] = redactValue(req["data"]);
    if (typeof req["url"] === "string") req["url"] = redactString(req["url"]);
    cloned["request"] = req;
  }

  if ("extra" in cloned) cloned["extra"] = redactValue(cloned["extra"]);
  if ("contexts" in cloned) cloned["contexts"] = redactValue(cloned["contexts"]);
  if ("breadcrumbs" in cloned) cloned["breadcrumbs"] = redactValue(cloned["breadcrumbs"]);

  return cloned as T;
}
