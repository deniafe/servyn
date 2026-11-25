import type { ReactNode } from "react";
import { Suspense } from "react";
import { AuthenticatedShellHeader } from "@/components/auth/AuthenticatedShellHeader";
import { requireRole } from "@/lib/auth";

async function VendorGate({ children }: { children: ReactNode }) {
  const gate = await requireRole("vendor", { requireMfa: true, returnTo: "/vendor" });
  if (!gate.allowed) return null;

  return (
    <div data-shell="vendor" className="min-h-screen bg-cream">
      <AuthenticatedShellHeader
        roles={gate.session.identity.roles}
        activeRole="vendor"
      />
      <main className="mx-auto max-w-[1240px] px-6 py-10 max-[720px]:px-4">{children}</main>
    </div>
  );
}

export default function VendorLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream" />}>
      <VendorGate>{children}</VendorGate>
    </Suspense>
  );
}
