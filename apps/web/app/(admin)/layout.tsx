import type { ReactNode } from "react";
import { Suspense } from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { AuthenticatedShellHeader } from "@/components/auth/AuthenticatedShellHeader";
import { DashboardShellSkeleton } from "@/components/auth/DashboardShellSkeleton";
import { requireRole } from "@/lib/auth";

async function AdminGate({ children }: { children: ReactNode }) {
  const gate = await requireRole("admin", { requireMfa: true, returnTo: "/admin" });

  if (!gate.allowed) {
    return (
      <div data-shell="admin" className="min-h-screen bg-cream">
        <AuthenticatedShellHeader
          roles={gate.session.identity.roles}
          activeRole={gate.session.activeRole}
        />
        <main className="mx-auto max-w-[540px] px-6 py-16">
          <section className="rounded-lg border border-line bg-surface p-8 text-center shadow-soft">
            <span className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-blush text-blush-d">
              <ShieldAlert className="size-6" aria-hidden="true" />
            </span>
            <h1 className="mt-4 font-serif text-2xl font-semibold text-ink">403 — Forbidden</h1>
            <p className="mt-2 text-sm text-mut">
              You do not have administrator permissions to access this console.
            </p>
            <Link
              href="/dashboard"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-leaf-800 px-5 py-2.5 text-sm font-semibold text-cream hover:bg-leaf-700"
            >
              Return to Dashboard
            </Link>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div data-shell="admin" className="min-h-screen bg-cream">
      <AuthenticatedShellHeader
        roles={gate.session.identity.roles}
        activeRole="admin"
      />
      <main className="mx-auto max-w-[1240px] px-6 py-10 max-[720px]:px-4">{children}</main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<DashboardShellSkeleton />}>
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}
