import { Suspense } from "react";
import { CustomerDashboardClient } from "@/components/demo/CustomerDashboardClient";
import { requireRole } from "@/lib/auth";

async function CustomerDashboardContent() {
  const gate = await requireRole("customer", { requireMfa: false, returnTo: "/dashboard" });
  if (!gate.allowed) return null;

  const { identity, hasMfa } = gate.session;
  const displayName = identity.customerProfile?.displayName ?? "there";

  return (
    <CustomerDashboardClient
      displayName={displayName}
      email={identity.user.email}
      hasMfa={hasMfa}
      isVendor={identity.roles.includes("vendor")}
      isSeller={identity.roles.includes("seller")}
    />
  );
}

export default function CustomerDashboardPage() {
  return (
    <Suspense fallback={<div className="h-96 rounded-lg bg-surface" />}>
      <CustomerDashboardContent />
    </Suspense>
  );
}
