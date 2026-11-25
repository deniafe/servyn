import { Suspense } from "react";
import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { isSafeRelativePath } from "@servyn/domain-identity";

async function SsoCallbackContent({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>;
}) {
  const params = await searchParams;
  const redirectUrl = isSafeRelativePath(params.redirect_url) ? params.redirect_url : "/";

  return (
    <AuthenticateWithRedirectCallback
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      secondFactorUrl={`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`}
      signInFallbackRedirectUrl={redirectUrl}
      signUpFallbackRedirectUrl={redirectUrl}
    />
  );
}

export default function SsoCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4 text-center">
      <div className="rounded-lg border border-line bg-surface px-8 py-6 shadow-soft">
        <p className="font-serif text-xl font-semibold text-ink">Completing sign-in...</p>
        <p className="mt-1 text-xs text-mut">Redirecting you to your Servyn account.</p>
      </div>
      <Suspense fallback={null}>
        <SsoCallbackContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
