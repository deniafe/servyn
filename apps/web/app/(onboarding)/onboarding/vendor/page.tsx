import { Suspense } from "react";
import { VendorOnboardingWizard } from "@/components/onboarding/VendorOnboardingWizard";
import { requireAuth } from "@/lib/auth";

async function VendorOnboardingContent() {
  const session = await requireAuth();
  const existingName =
    session.identity.vendorProfile?.businessName ??
    session.identity.customerProfile?.displayName ??
    "";

  return <VendorOnboardingWizard defaultBusinessName={existingName} hasMfa={session.hasMfa} />;
}

export default function VendorOnboardingPage() {
  return (
    <div className="mx-auto max-w-[640px] rounded-lg border border-line bg-surface p-6 shadow-soft sm:p-8">
      <span className="mb-3 inline-flex rounded-full border border-gold-300 bg-gold-100 px-3 py-1 text-[11.5px] font-bold text-butter-d">
        Service Vendor Onboarding
      </span>
      <h1 className="font-serif text-2xl font-semibold text-ink sm:text-[28px]">
        Set up your vendor profile
      </h1>
      <p className="mt-1.5 text-sm text-mut">
        Add service vendor capabilities to your existing Servyn account — no separate login needed.
      </p>
      <div className="mt-6">
        <Suspense fallback={<div className="h-72 rounded-md bg-surface-2" />}>
          <VendorOnboardingContent />
        </Suspense>
      </div>
    </div>
  );
}
