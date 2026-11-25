import type { ReactNode } from "react";
import { Suspense } from "react";
import { AuthenticatedShellHeader } from "@/components/auth/AuthenticatedShellHeader";
import { requireAuth } from "@/lib/auth";

async function AccountGate({ children }: { children: ReactNode }) {
  const session = await requireAuth();
  return (
    <div data-shell="account" className="min-h-screen bg-cream">
      <AuthenticatedShellHeader
        roles={session.identity.roles}
        activeRole={session.activeRole}
      />
      <main className="mx-auto max-w-[1240px] px-6 py-10 max-[720px]:px-4">{children}</main>
    </div>
  );
}

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream" />}>
      <AccountGate>{children}</AccountGate>
    </Suspense>
  );
}
