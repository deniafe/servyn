import { Suspense } from "react";
import { CustomerOnboardingWizard } from "@/components/onboarding/CustomerOnboardingWizard";
import { requireAuth } from "@/lib/auth";

async function CustomerOnboardingContent() {
  const session = await requireAuth();
  const profile = session.identity.customerProfile;

  return (
    <CustomerOnboardingWizard
      defaultDisplayName={profile?.displayName ?? ""}
      defaultAreaLabel={profile?.defaultLocation?.label ?? "Hulme"}
      defaultMarketingOptIn={profile?.marketingOptIn ?? false}
    />
  );
}

export default function CustomerOnboardingPage() {
  return (
    <div className="mx-auto max-w-[560px] rounded-lg border border-line bg-surface p-6 shadow-soft sm:p-8">
      <span className="mb-3 inline-flex rounded-full bg-mint px-3 py-1 text-[11.5px] font-bold text-mint-d">
        Customer Setup · Optional
      </span>
      <h1 className="font-serif text-2xl font-semibold text-ink sm:text-[28px]">
        Personalise your Servyn experience
      </h1>
      <p className="mt-1.5 text-sm text-mut">
        Tell us your name and preferred Manchester area so we can surface relevant providers first.
      </p>
      <div className="mt-6">
        <Suspense fallback={<div className="h-64 rounded-md bg-surface-2" />}>
          <CustomerOnboardingContent />
        </Suspense>
      </div>
    </div>
  );
}
