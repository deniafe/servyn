import { Suspense } from "react";
import { VendorDashboardClient } from "@/components/demo/VendorDashboardClient";
import { requireRole } from "@/lib/auth";

async function VendorDashboardContent() {
  const gate = await requireRole("vendor", { requireMfa: true, returnTo: "/vendor" });
  if (!gate.allowed) return null;

  const { identity } = gate.session;
  const vendor = identity.vendorProfile;

  return (
    <VendorDashboardClient
      businessName={vendor?.businessName ?? "Servyn Vendor"}
      email={identity.user.email}
      verificationStatus={vendor?.verificationStatus ?? "unverified"}
    />
  );
}

export default function VendorDashboardPage() {
  return (
    <Suspense fallback={<div className="h-96 rounded-lg bg-surface" />}>
      <VendorDashboardContent />
    </Suspense>
  );
}
