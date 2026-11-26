"use client";

import * as React from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Download,
  FileText,
  ShieldCheck,
  Store,
  Users,
  XCircle,
} from "lucide-react";
import {
  formatMinorGBP,
  resolveDisputeInvoice,
  updatePendingVendorStatus,
  useDemoFlow,
} from "@/lib/demo-flow-store";
import { cn } from "@/lib/utils";

type AdminTab = "overview" | "vendors" | "disputes" | "finance" | "users";

const DEMO_USERS = [
  { name: "Adaeze N.", email: "adaeze@servyn.uk", role: "Customer", area: "Hulme", status: "Active" },
  {
    name: "Amara Hair & Beauty",
    email: "amara@servyn.uk",
    role: "Vendor · 2FA",
    area: "Hulme",
    status: "Verified",
  },
  {
    name: "Kofi's Kitchen",
    email: "kofi@servyn.uk",
    role: "Seller · 2FA",
    area: "Moss Side",
    status: "Verified",
  },
  {
    name: "Mama Efe's Kitchen",
    email: "efe@servyn.uk",
    role: "Vendor · 2FA",
    area: "Cheetham Hill",
    status: "Verified",
  },
] as const;

export function AdminConsoleClient({
  adminEmail,
  isDemoPreview = false,
}: {
  adminEmail: string;
  isDemoPreview?: boolean;
}) {
  const { invoices, pendingVendors, customServices, customProducts } = useDemoFlow();
  const [tab, setTab] = React.useState<AdminTab>("overview");

  const grossMinor = invoices.reduce((sum, i) => sum + i.totalMinor, 0);
  const heldMinor = invoices
    .filter((i) => i.status === "paid_held" || i.status === "delivered" || i.status === "disputed")
    .reduce((sum, i) => sum + i.totalMinor, 0);
  const releasedMinor = invoices
    .filter((i) => i.status === "released")
    .reduce((sum, i) => sum + i.subtotalMinor, 0);
  const feeRevenueMinor = invoices
    .filter((i) => i.status === "released" || i.status === "paid_held" || i.status === "delivered")
    .reduce((sum, i) => sum + i.feeMinor, 0);

  const openDisputes = invoices.filter((i) => i.status === "disputed");
  const resolvedDisputes = invoices.filter(
    (i) => i.status === "refunded" || (i.disputedAt && i.status === "released"),
  );
  const pendingCount = pendingVendors.filter((v) => v.status === "pending").length;

  function handleExportFinanceCsv() {
    const header = [
      "RefID",
      "Kind",
      "Customer",
      "Provider",
      "Title",
      "SubtotalGBP",
      "ServynFeeGBP",
      "TotalGBP",
      "Status",
      "CreatedAt",
    ];
    const rows = invoices.map((inv) => [
      inv.refId,
      inv.kind,
      `"${inv.customerName.replace(/"/g, '""')}"`,
      `"${inv.providerName.replace(/"/g, '""')}"`,
      `"${inv.title.replace(/"/g, '""')}"`,
      (inv.subtotalMinor / 100).toFixed(2),
      (inv.feeMinor / 100).toFixed(2),
      (inv.totalMinor / 100).toFixed(2),
      inv.status,
      inv.createdAt.slice(0, 10),
    ]);
    const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `servyn-finance-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      {/* Dark leaf-950 left rail */}
      <aside className="flex flex-col justify-between rounded-[18px] bg-leaf-950 p-5 text-cream shadow-lift">
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-200 px-3 py-1 text-[11px] font-bold text-gold-ink">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              <span>{isDemoPreview ? "Admin Preview" : "Admin · MFA"}</span>
            </span>
          </div>

          <nav className="space-y-2 text-xs font-semibold">
            {(
              [
                { id: "overview", label: "Overview", icon: BarChart3, badge: null },
                {
                  id: "vendors",
                  label: "Vendor approvals",
                  icon: Store,
                  badge: pendingCount > 0 ? pendingCount : null,
                },
                {
                  id: "disputes",
                  label: "Disputes & complaints",
                  icon: AlertTriangle,
                  badge: openDisputes.length > 0 ? openDisputes.length : null,
                },
                { id: "finance", label: "Bookings & finance", icon: FileText, badge: invoices.length },
                { id: "users", label: "Users & accounts", icon: Users, badge: null },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "flex w-full cursor-pointer items-center justify-between rounded-md border px-3 py-2.5 text-left transition-colors",
                    tab === item.id
                      ? "border-gold-500/60 bg-leaf-800/90 text-cream"
                      : "border-cream/10 bg-leaf-900/50 text-cream-75 hover:text-cream",
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    <Icon className="size-3.5 text-gold-300" aria-hidden="true" />
                    <span>{item.label}</span>
                  </span>
                  {item.badge !== null ? (
                    <span className="rounded-full bg-gold-500 px-2 py-0.5 text-[10px] font-bold text-gold-ink">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-6 border-t border-cream/12 pt-4 text-[11px] text-cream-60">
          <p className="font-semibold text-cream">Operator</p>
          <p className="truncate">{adminEmail}</p>
          <p className="mt-1">All dispute resolutions &amp; approvals update the live demo ledger.</p>
        </div>
      </aside>

      {/* Main console panel */}
      <div className="space-y-6">
        <section className="rounded-[18px] border border-line bg-surface p-6 shadow-soft">
          <span className="inline-block rounded-full bg-gold-100 px-2.5 py-0.5 text-[11px] font-bold text-butter-d">
            Servyn Operations Console
          </span>
          <h1 className="mt-2 font-serif text-2xl font-semibold text-ink sm:text-3xl">
            {tab === "overview"
              ? "Platform Operations Overview"
              : tab === "vendors"
                ? "Vendor Verification Queue"
                : tab === "disputes"
                  ? "Disputes & Protected Payment Oversight"
                  : tab === "finance"
                    ? "Bookings & Protected Payment Ledger"
                    : "Users & Role Contexts"}
          </h1>
        </section>

        {tab === "overview" ? (
          <section className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-[16px] border border-line bg-surface p-4 shadow-soft">
                <p className="text-[11px] font-bold uppercase tracking-wider text-mut">
                  Gross Volume
                </p>
                <p className="mt-1 font-serif text-2xl font-semibold tabular-nums text-ink">
                  {formatMinorGBP(grossMinor)}
                </p>
                <p className="mt-1 text-xs text-mut">{invoices.length} invoices total</p>
              </div>
              <div className="rounded-[16px] border border-line bg-surface p-4 shadow-soft">
                <p className="text-[11px] font-bold uppercase tracking-wider text-mut">
                  Held by Servyn
                </p>
                <p className="mt-1 font-serif text-2xl font-semibold tabular-nums text-leaf-900">
                  {formatMinorGBP(heldMinor)}
                </p>
                <p className="mt-1 text-xs text-mut">Protected until delivery</p>
              </div>
              <div className="rounded-[16px] border border-line bg-surface p-4 shadow-soft">
                <p className="text-[11px] font-bold uppercase tracking-wider text-mut">
                  Servyn Fee Earned
                </p>
                <p className="mt-1 font-serif text-2xl font-semibold tabular-nums text-gold-600">
                  {formatMinorGBP(feeRevenueMinor)}
                </p>
                <p className="mt-1 text-xs text-mut">Released payouts: {formatMinorGBP(releasedMinor)}</p>
              </div>
              <div className="rounded-[16px] border border-line bg-surface p-4 shadow-soft">
                <p className="text-[11px] font-bold uppercase tracking-wider text-mut">
                  Action Queue
                </p>
                <p className="mt-1 font-serif text-2xl font-semibold tabular-nums text-blush-d">
                  {openDisputes.length + pendingCount}
                </p>
                <p className="mt-1 text-xs text-mut">
                  {openDisputes.length} disputes · {pendingCount} pending vendors
                </p>
              </div>
            </div>

            <div className="rounded-[18px] border border-line bg-surface p-6 shadow-soft text-sm text-ink-2">
              <h2 className="font-serif text-lg font-semibold text-ink">Live Marketplace Summary</h2>
              <p className="mt-2 leading-relaxed">
                Manchester launch catalogue includes <strong>{customServices.length}</strong>{" "}
                newly published vendor services and <strong>{customProducts.length}</strong> newly
                published seller products alongside seeded providers. All protected-payment payouts
                remain held until customer confirmation or admin dispute resolution.
              </p>
            </div>
          </section>
        ) : null}

        {tab === "vendors" ? (
          <section className="space-y-3 rounded-[18px] border border-line bg-surface p-6 shadow-soft">
            {pendingVendors.map((vendor) => (
              <div
                key={vendor.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-line bg-surface-2 p-4"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-serif text-lg font-semibold text-ink">
                      {vendor.businessName}
                    </h2>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                        vendor.status === "approved"
                          ? "bg-mint text-mint-d"
                          : vendor.status === "rejected"
                            ? "bg-blush text-blush-d"
                            : vendor.status === "changes_requested"
                              ? "bg-sky text-sky-d"
                              : "bg-butter text-butter-d",
                      )}
                    >
                      {vendor.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-mut">
                    {vendor.category} · {vendor.area} · {vendor.email} · Submitted{" "}
                    {vendor.submittedAt.slice(0, 10)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => updatePendingVendorStatus(vendor.id, "approved")}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-leaf-800 px-3.5 py-1.5 font-semibold text-cream hover:bg-leaf-700"
                  >
                    <CheckCircle2 className="size-3.5" aria-hidden="true" />
                    <span>Approve</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updatePendingVendorStatus(vendor.id, "changes_requested")}
                    className="cursor-pointer rounded-full border border-line-2 bg-surface px-3.5 py-1.5 font-semibold text-ink-2 hover:border-gold-400"
                  >
                    Request changes
                  </button>
                  <button
                    type="button"
                    onClick={() => updatePendingVendorStatus(vendor.id, "rejected")}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-blush px-3.5 py-1.5 font-semibold text-blush-d"
                  >
                    <XCircle className="size-3.5" aria-hidden="true" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </section>
        ) : null}

        {tab === "disputes" ? (
          <section className="space-y-4 rounded-[18px] border border-line bg-surface p-6 shadow-soft">
            {openDisputes.length === 0 ? (
              <div className="rounded-lg border border-line bg-surface-2 p-6 text-center text-sm text-mut">
                No active disputes right now. Report a problem on any held booking in{" "}
                <strong>/dashboard</strong> to test pausing &amp; resolving a payout here.
              </div>
            ) : (
              openDisputes.map((inv) => (
                <div
                  key={inv.id}
                  className="rounded-lg border border-blush-d/30 bg-surface-2 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-leaf-900 px-2 py-0.5 text-[10.5px] font-bold text-gold-300">
                          {inv.refId}
                        </span>
                        <span className="rounded-full bg-blush px-2.5 py-0.5 text-[11px] font-bold text-blush-d">
                          Payout paused
                        </span>
                      </div>
                      <h2 className="mt-1.5 font-serif text-lg font-semibold text-ink">
                        {inv.title}
                      </h2>
                      <p className="text-xs text-mut">
                        Customer: {inv.customerName} · Provider: {inv.providerName}
                      </p>
                      <p className="mt-1.5 text-xs font-semibold text-blush-d">
                        Reason: {inv.disputeReason ?? "Customer reported an issue"}
                      </p>
                    </div>
                    <p className="font-serif text-xl font-semibold tabular-nums text-ink">
                      {formatMinorGBP(inv.totalMinor)}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-line pt-3 text-xs">
                    <button
                      type="button"
                      onClick={() => resolveDisputeInvoice(inv.id, "refund")}
                      className="cursor-pointer rounded-full bg-blush px-4 py-2 font-semibold text-blush-d hover:brightness-95"
                    >
                      Refund customer
                    </button>
                    <button
                      type="button"
                      onClick={() => resolveDisputeInvoice(inv.id, "release")}
                      className="cursor-pointer rounded-full bg-leaf-800 px-4 py-2 font-semibold text-cream hover:bg-leaf-700"
                    >
                      Release payment to provider
                    </button>
                  </div>
                </div>
              ))
            )}

            {resolvedDisputes.length > 0 ? (
              <div className="border-t border-line pt-4">
                <h3 className="font-serif text-base font-semibold text-ink">
                  Resolved Disputes ({resolvedDisputes.length})
                </h3>
                <div className="mt-2 space-y-2">
                  {resolvedDisputes.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between rounded-md border border-line bg-surface-2 px-3.5 py-2.5 text-xs"
                    >
                      <span>
                        <strong>{inv.refId}</strong> · {inv.title} ({inv.customerName} /{" "}
                        {inv.providerName})
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 font-bold",
                          inv.status === "refunded"
                            ? "bg-blush text-blush-d"
                            : "bg-mint text-mint-d",
                        )}
                      >
                        {inv.status === "refunded" ? "Refunded to customer" : "Released to provider"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {tab === "finance" ? (
          <section className="space-y-4 rounded-[18px] border border-line bg-surface p-6 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-mut">
                Downloadable ledger records for reconciliation ({invoices.length} entries).
              </p>
              <button
                type="button"
                onClick={handleExportFinanceCsv}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-linear-to-b from-grad-gold-1 to-grad-gold-2 px-4 py-2 text-xs font-semibold text-gold-ink shadow-gold"
              >
                <Download className="size-3.5" aria-hidden="true" />
                <span>Export CSV</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-line text-[11px] uppercase tracking-wider text-mut">
                  <tr>
                    <th className="py-2 pr-3">Ref ID</th>
                    <th className="py-2 pr-3">Item</th>
                    <th className="py-2 pr-3">Customer</th>
                    <th className="py-2 pr-3">Provider</th>
                    <th className="py-2 pr-3">Subtotal</th>
                    <th className="py-2 pr-3">Fee</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="py-2.5 pr-3 font-bold text-leaf-900">{inv.refId}</td>
                      <td className="py-2.5 pr-3 font-medium text-ink">{inv.title}</td>
                      <td className="py-2.5 pr-3 text-mut">{inv.customerName}</td>
                      <td className="py-2.5 pr-3 text-mut">{inv.providerName}</td>
                      <td className="py-2.5 pr-3 tabular-nums">{formatMinorGBP(inv.subtotalMinor)}</td>
                      <td className="py-2.5 pr-3 tabular-nums">{formatMinorGBP(inv.feeMinor)}</td>
                      <td className="py-2.5">
                        <span className="rounded-full bg-surface-2 px-2.5 py-0.5 font-semibold text-ink-2">
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {tab === "users" ? (
          <section className="space-y-3 rounded-[18px] border border-line bg-surface p-6 shadow-soft">
            {DEMO_USERS.map((u) => (
              <div
                key={u.email}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface-2 px-4 py-3 text-xs"
              >
                <div>
                  <p className="font-semibold text-ink">{u.name}</p>
                  <p className="text-mut">
                    {u.email} · {u.area}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-surface px-2.5 py-0.5 font-semibold text-ink-2">
                    {u.role}
                  </span>
                  <span className="rounded-full bg-mint px-2.5 py-0.5 font-bold text-mint-d">
                    {u.status}
                  </span>
                </div>
              </div>
            ))}
          </section>
        ) : null}
      </div>
    </div>
  );
}
