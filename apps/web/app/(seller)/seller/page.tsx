import { Suspense } from "react";
import { SellerDashboardClient } from "@/components/demo/SellerDashboardClient";
import { requireRole } from "@/lib/auth";

async function SellerDashboardContent() {
  const gate = await requireRole("seller", { requireMfa: true, returnTo: "/seller" });
  if (!gate.allowed) return null;

  const { identity } = gate.session;
  const vendor = identity.vendorProfile;

  return (
    <SellerDashboardClient
      storefrontName={vendor?.businessName ?? "Servyn Seller"}
      email={identity.user.email}
      verificationStatus={vendor?.verificationStatus ?? "unverified"}
    />
  );
}

export default function SellerDashboardPage() {
  return (
    <Suspense fallback={<div className="h-96 rounded-lg bg-surface" />}>
      <SellerDashboardContent />
    </Suspense>
  );
}
