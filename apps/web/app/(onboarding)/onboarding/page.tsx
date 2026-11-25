import { Suspense } from "react";
import { RoleChooserCard } from "@/components/auth/RoleChooserCard";
import { requireAuth } from "@/lib/auth";

async function OnboardingHubContent({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string }>;
}) {
  const [, params] = await Promise.all([requireAuth(), searchParams]);
  const defaultIntent =
    params.intent === "vendor" || params.intent === "seller" ? params.intent : "customer";

  return <RoleChooserCard defaultIntent={defaultIntent} />;
}

export default function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string }>;
}) {
  return (
    <div className="mx-auto max-w-[540px] rounded-lg border border-line bg-surface p-6 shadow-soft sm:p-8">
      <span className="mb-3 inline-flex rounded-full border border-gold-300 bg-gold-100 px-3 py-1 text-[11.5px] font-bold text-butter-d">
        One account, multiple roles
      </span>
      <h1 className="font-serif text-2xl font-semibold text-ink sm:text-[28px]">
        How will you use Servyn?
      </h1>
      <p className="mt-1.5 text-sm text-mut">
        Start as a customer. You can add vendor or seller capabilities anytime without creating a
        new account.
      </p>
      <div className="mt-6">
        <Suspense fallback={<div className="h-64 rounded-md bg-surface-2" />}>
          <OnboardingHubContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
