import { Suspense } from "react";
import { ShieldCheck } from "lucide-react";
import { requireRole } from "@/lib/auth";

async function AdminConsoleContent() {
  const gate = await requireRole("admin", { requireMfa: true, returnTo: "/admin" });
  if (!gate.allowed) return null;

  return (
    <section className="rounded-lg border border-line bg-surface p-6 shadow-soft">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-full border border-gold-300 bg-gold-100 px-2.5 py-0.5 text-[11.5px] font-bold text-butter-d">
          Admin · MFA Verified
        </span>
      </div>
      <h1 className="font-serif text-2xl font-semibold text-ink sm:text-3xl">
        Servyn Operations Console
      </h1>
      <p className="mt-1.5 text-sm text-mut">
        Authenticated as {gate.session.identity.user.email}. Moderation, dispute oversight, and
        configuration tools are wired in Phase 1–3 units.
      </p>
      <div className="mt-5 flex items-center gap-3 rounded-md border border-line bg-surface-2 p-4 text-xs text-ink-2">
        <ShieldCheck className="size-4 shrink-0 text-leaf-600" aria-hidden="true" />
        <span>All admin actions require MFA and are recorded to audit_log.</span>
      </div>
    </section>
  );
}

export default function AdminConsolePage() {
  return (
    <Suspense fallback={<div className="h-48 rounded-lg bg-surface" />}>
      <AdminConsoleContent />
    </Suspense>
  );
}
