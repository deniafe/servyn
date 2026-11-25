import { Suspense } from "react";
import { MessagesWorkspace } from "@/components/demo/MessagesWorkspace";
import { requireRole } from "@/lib/auth";

async function MessagesContent() {
  const gate = await requireRole("customer", { requireMfa: false, returnTo: "/messages" });
  if (!gate.allowed) return null;

  const displayName = gate.session.identity.customerProfile?.displayName ?? "Customer";
  return <MessagesWorkspace customerName={displayName} />;
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="h-96 rounded-lg bg-surface" />}>
      <MessagesContent />
    </Suspense>
  );
}
