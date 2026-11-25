import type { ReactNode } from "react";
import { Suspense } from "react";
import { AuthenticatedShellHeader } from "@/components/auth/AuthenticatedShellHeader";
import { requireRole } from "@/lib/auth";

async function SellerGate({ children }: { children: ReactNode }) {
  const gate = await requireRole("seller", { requireMfa: true, returnTo: "/seller" });
  if (!gate.allowed) return null;

  return (
    <div data-shell="seller" className="min-h-screen bg-cream">
      <AuthenticatedShellHeader
        roles={gate.session.identity.roles}
        activeRole="seller"
      />
      <main className="mx-auto max-w-[1240px] px-6 py-10 max-[720px]:px-4">{children}</main>
    </div>
  );
}

export default function SellerLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream" />}>
      <SellerGate>{children}</SellerGate>
    </Suspense>
  );
}
