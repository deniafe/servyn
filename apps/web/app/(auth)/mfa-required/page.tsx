import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { isSafeRelativePath } from "@servyn/domain-identity";
import { AuthShell } from "@/components/auth/AuthShell";
import { CustomMfaSetupCard } from "@/components/auth/CustomMfaSetupCard";
import { hasVerifiedMfa } from "@/lib/auth";
import { MFA_ENROLLED_COOKIE, verifyMfaEnrolledToken } from "@/lib/mfa-session-cookie";

async function MfaContent({ searchParams }: { searchParams: Promise<{ redirect_url?: string }> }) {
  const params = await searchParams;
  const redirectUrl = isSafeRelativePath(params.redirect_url) ? params.redirect_url : "/account";

  const { userId, sessionId, sessionClaims } = await auth();
  if (userId) {
    const cookieStore = await cookies();
    const isVerified =
      hasVerifiedMfa(sessionClaims) ||
      (await verifyMfaEnrolledToken(
        cookieStore.get(MFA_ENROLLED_COOKIE)?.value,
        userId,
        sessionId,
      ));
    if (isVerified) {
      redirect(redirectUrl);
    }
  }

  return <CustomMfaSetupCard redirectUrl={redirectUrl} />;
}

export default function MfaRequiredPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>;
}) {
  return (
    <AuthShell
      badge="Required For Admins · Optional Security"
      badgeTone="gold"
      title="Two-factor authentication"
      subtitle="A second step at login protects payouts, customer addresses, and booking chats."
      quote="Protected payments mean I get paid when the job's done — no more chasing."
      quoteAuthor="Amara N. · Vendor"
      maxWidthClass="max-w-[520px]"
    >
      <Suspense fallback={<div className="h-48 rounded-md bg-surface-2" />}>
        <MfaContent searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}
