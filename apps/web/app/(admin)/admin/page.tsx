import { Suspense } from "react";
import { AdminConsoleClient } from "@/components/demo/AdminConsoleClient";
import { requireRole } from "@/lib/auth";

async function AdminConsoleContent() {
  const gate = await requireRole("admin", { requireMfa: true, returnTo: "/admin" });
  if (!gate.allowed) return null;

  return <AdminConsoleClient adminEmail={gate.session.identity.user.email} />;
}

export default function AdminConsolePage() {
  return (
    <Suspense fallback={<div className="h-48 rounded-lg bg-surface" />}>
      <AdminConsoleContent />
    </Suspense>
  );
}
