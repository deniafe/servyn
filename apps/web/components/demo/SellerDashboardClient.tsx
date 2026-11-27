"use client";

import * as React from "react";
import Link from "next/link";
import {
  Check,
  Download,
  FileText,
  MessageSquare,
  Package,
  Plus,
  Store,
  Truck,
} from "lucide-react";
import {
  addProductListing,
  formatMinorGBP,
  markInvoiceDelivered,
  useDemoFlow,
} from "@/lib/demo-flow-store";
import { downloadGdprPdf } from "@/lib/gdpr-pdf";
import { cn } from "@/lib/utils";

const PRODUCT_CATEGORIES = [
  "Food & Pantry",
  "Fabrics & Fashion",
  "Beauty & Hair Care",
  "Crafts & Homeware",
] as const;

export function SellerDashboardClient({
  storefrontName,
  email,
  verificationStatus,
}: {
  storefrontName: string;
  email: string;
  verificationStatus: string;
}) {
  const { customProducts, invoices, conversations } = useDemoFlow();
  const [tab, setTab] = React.useState<"products" | "orders">("products");

  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState<string>("Food & Pantry");
  const [retailGBP, setRetailGBP] = React.useState("14.00");
  const [bulkGBP, setBulkGBP] = React.useState("10.50");
  const [minBulkQty, setMinBulkQty] = React.useState("10");
  const [stock, setStock] = React.useState("40");
  const [unit, setUnit] = React.useState("pack");
  const [originNote, setOriginNote] = React.useState("Sourced in West Africa · Manchester stock");
  const [publishedBanner, setPublishedBanner] = React.useState<string | null>(null);
  const [exportingPdf, setExportingPdf] = React.useState(false);

  const productInvoices = invoices.filter((i) => i.kind === "product");
  const heldMinor = productInvoices
    .filter((i) => i.status === "paid_held" || i.status === "delivered")
    .reduce((sum, i) => sum + i.subtotalMinor, 0);
  const releasedMinor = productInvoices
    .filter((i) => i.status === "released")
    .reduce((sum, i) => sum + i.subtotalMinor, 0);

  function handlePublishProduct(e: React.FormEvent) {
    e.preventDefault();
    const retailMinor = Math.round((Number.parseFloat(retailGBP) || 0) * 100);
    const bulkMinor = Math.round((Number.parseFloat(bulkGBP) || 0) * 100);
    if (!title.trim() || retailMinor <= 0) return;

    addProductListing({
      sellerName: storefrontName,
      title: title.trim(),
      category,
      retailPriceMinor: retailMinor,
      bulkPriceMinor: bulkMinor > 0 ? bulkMinor : retailMinor,
      minBulkQty: Math.max(2, Number.parseInt(minBulkQty, 10) || 10),
      stock: Math.max(1, Number.parseInt(stock, 10) || 20),
      unit: unit.trim() || "item",
      originNote: originNote.trim() || "Manchester stock",
    });

    setPublishedBanner(`"${title.trim()}" is now live in the African Market!`);
    setTitle("");
  }

  async function handleExportPdf() {
    setExportingPdf(true);
    try {
      await downloadGdprPdf({
        role: "seller",
        businessName: storefrontName,
        email,
        verificationStatus,
        mfaEnabled: false,
        services: [],
        products: customProducts,
        invoices: productInvoices,
        conversations: conversations.filter((c) => c.kind === "product"),
      });
    } finally {
      setExportingPdf(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[270px_1fr]">
      <aside className="flex flex-col justify-between rounded-[18px] bg-leaf-950 p-5 text-cream shadow-lift">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-200 px-3 py-1 text-[11.5px] font-bold text-gold-ink">
              <Store className="size-3.5" aria-hidden="true" />
              <span>Product seller</span>
            </span>
          </div>

          <nav className="space-y-2 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setTab("products")}
              className={cn(
                "flex w-full cursor-pointer items-center justify-between rounded-md border px-3 py-2.5 text-left transition-colors",
                tab === "products"
                  ? "border-gold-500/60 bg-leaf-800/90 text-cream"
                  : "border-cream/10 bg-leaf-900/50 text-cream-75 hover:text-cream",
              )}
            >
              <span>My products &amp; tiers</span>
              <Package className="size-3.5 text-gold-300" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setTab("orders")}
              className={cn(
                "flex w-full cursor-pointer items-center justify-between rounded-md border px-3 py-2.5 text-left transition-colors",
                tab === "orders"
                  ? "border-gold-500/60 bg-leaf-800/90 text-cream"
                  : "border-cream/10 bg-leaf-900/50 text-cream-75 hover:text-cream",
              )}
            >
              <span>Orders &amp; invoices</span>
              <span className="rounded-full bg-gold-500 px-2 py-0.5 text-[10px] font-bold text-gold-ink">
                {productInvoices.length}
              </span>
            </button>
            <Link
              href="/messages"
              className="flex items-center justify-between rounded-md border border-cream/10 bg-leaf-900/50 px-3 py-2.5 text-cream-75 transition-colors hover:text-cream"
            >
              <span>Discount negotiations</span>
              <MessageSquare className="size-3.5 text-gold-300" aria-hidden="true" />
            </Link>
          </nav>
        </div>

        <div className="mt-6 space-y-3 border-t border-cream/12 pt-4">
          <button
            type="button"
            disabled={exportingPdf}
            onClick={() => void handleExportPdf()}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-linear-to-b from-grad-gold-1 to-grad-gold-2 px-4 py-2.5 text-xs font-semibold text-gold-ink shadow-gold transition-all hover:brightness-105 disabled:opacity-60"
          >
            <Download className="size-3.5" aria-hidden="true" />
            <span>{exportingPdf ? "Generating PDF..." : "Download GDPR PDF"}</span>
          </button>
          <p className="text-[11px] leading-relaxed text-cream-60">
            Downloadable records you can share with your accountant (UK GDPR Art. 15/20).
          </p>
        </div>
      </aside>

      <div className="space-y-6">
        <section className="rounded-[18px] border border-line bg-surface p-6 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="inline-block rounded-full bg-gold-100 px-2.5 py-0.5 text-[11px] font-bold text-butter-d">
                Seller Storefront · {storefrontName}
              </span>
              <h1 className="mt-2 font-serif text-2xl font-semibold text-ink sm:text-3xl">
                {tab === "products" ? "African Market Products" : "Orders & Discount Invoices"}
              </h1>
              <p className="mt-1 text-xs text-mut">
                List retail &amp; bulk products, negotiate discounts in chat, and receive payouts
                once customers confirm delivery.
              </p>
            </div>

            <button
              type="button"
              disabled={exportingPdf}
              onClick={() => void handleExportPdf()}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-line-2 px-4 py-2 text-xs font-semibold text-ink-2 transition-colors hover:border-leaf-500 hover:bg-leaf-50"
            >
              <Download className="size-3.5 text-leaf-700" aria-hidden="true" />
              <span>Export GDPR &amp; Ledger PDF</span>
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-sky-d/15 bg-sky/60 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-sky-d">
                Held by Servyn (Protected)
              </p>
              <p className="mt-1 font-serif text-2xl font-semibold tabular-nums text-ink">
                {formatMinorGBP(heldMinor)}
              </p>
              <p className="mt-0.5 text-[11px] text-mut">Releases on customer receipt</p>
            </div>
            <div className="rounded-lg border border-mint-d/15 bg-mint/60 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-mint-d">
                Available &amp; Released
              </p>
              <p className="mt-1 font-serif text-2xl font-semibold tabular-nums text-ink">
                {formatMinorGBP(releasedMinor)}
              </p>
              <p className="mt-0.5 text-[11px] text-mut">Cleared to your payout balance</p>
            </div>
            <div className="rounded-lg border border-line bg-surface-2 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-mut">
                Custom Products Listed
              </p>
              <p className="mt-1 font-serif text-2xl font-semibold tabular-nums text-ink">
                {customProducts.length}
              </p>
              <Link
                href="/market"
                className="mt-0.5 inline-block text-[11px] font-semibold text-leaf-700 hover:underline"
              >
                View live in Market →
              </Link>
            </div>
          </div>
        </section>

        {tab === "products" ? (
          <section className="space-y-5 rounded-[18px] border border-line bg-surface p-6 shadow-soft">
            {publishedBanner ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-leaf-300 bg-mint p-3.5 text-xs font-semibold text-mint-d">
                <span className="inline-flex items-center gap-2">
                  <Check className="size-4" aria-hidden="true" />
                  {publishedBanner}
                </span>
                <Link href="/market" className="underline">
                  View on African Market →
                </Link>
              </div>
            ) : null}

            <form onSubmit={handlePublishProduct} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-ink-2">Product title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Aged Plantain Flour · 2kg"
                    className="w-full rounded-md border-[1.5px] border-line-2 bg-surface-2 px-3 py-2 text-sm text-ink focus:border-gold-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-ink-2">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-md border-[1.5px] border-line-2 bg-surface-2 px-3 py-2 text-sm text-ink focus:border-gold-500 focus:outline-none"
                  >
                    {PRODUCT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-ink-2">Retail price (£)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={retailGBP}
                    onChange={(e) => setRetailGBP(e.target.value)}
                    className="w-full rounded-md border-[1.5px] border-line-2 bg-surface-2 px-3 py-2 text-sm text-ink focus:border-gold-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-ink-2">Bulk price (£)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={bulkGBP}
                    onChange={(e) => setBulkGBP(e.target.value)}
                    className="w-full rounded-md border-[1.5px] border-line-2 bg-surface-2 px-3 py-2 text-sm text-ink focus:border-gold-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-ink-2">Min bulk qty</label>
                  <input
                    type="number"
                    min="2"
                    required
                    value={minBulkQty}
                    onChange={(e) => setMinBulkQty(e.target.value)}
                    className="w-full rounded-md border-[1.5px] border-line-2 bg-surface-2 px-3 py-2 text-sm text-ink focus:border-gold-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-ink-2">Stock ({unit})</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full rounded-md border-[1.5px] border-line-2 bg-surface-2 px-3 py-2 text-sm text-ink focus:border-gold-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-ink-2">Unit label</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="pack, jar, yard..."
                    className="w-full rounded-md border-[1.5px] border-line-2 bg-surface-2 px-3 py-2 text-sm text-ink focus:border-gold-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-ink-2">Origin / dispatch note</label>
                  <input
                    type="text"
                    value={originNote}
                    onChange={(e) => setOriginNote(e.target.value)}
                    className="w-full rounded-md border-[1.5px] border-line-2 bg-surface-2 px-3 py-2 text-sm text-ink focus:border-gold-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-linear-to-b from-grad-gold-1 to-grad-gold-2 px-5 py-2.5 text-sm font-semibold text-gold-ink shadow-gold hover:brightness-105"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  <span>Publish product</span>
                </button>
              </div>
            </form>

            {customProducts.length > 0 ? (
              <div className="space-y-2 border-t border-line pt-4">
                <h2 className="font-serif text-base font-semibold text-ink">
                  Your Published Products
                </h2>
                <div className="grid gap-2 sm:grid-cols-2">
                  {customProducts.map((prd) => (
                    <div
                      key={prd.id}
                      className="flex items-center justify-between rounded-md border border-line bg-surface-2 px-3.5 py-2.5 text-xs"
                    >
                      <div>
                        <p className="font-semibold text-ink">{prd.title}</p>
                        <p className="text-mut">
                          {prd.category} · Bulk {formatMinorGBP(prd.bulkPriceMinor)} ({prd.minBulkQty}+)
                        </p>
                      </div>
                      <span className="font-serif text-sm font-semibold text-leaf-900">
                        {formatMinorGBP(prd.retailPriceMinor)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ) : (
          <section className="space-y-4 rounded-[18px] border border-line bg-surface p-6 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-serif text-xl font-semibold text-ink">
                Product Orders &amp; Discount Invoices
              </h2>
              <Link
                href="/messages"
                className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-b from-grad-gold-1 to-grad-gold-2 px-4 py-2 text-xs font-semibold text-gold-ink shadow-gold"
              >
                <FileText className="size-3.5" aria-hidden="true" />
                <span>Send discounted invoice</span>
              </Link>
            </div>

            <div className="space-y-3">
              {productInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface-2 p-4 text-xs"
                >
                  <div>
                    <p className="font-serif text-base font-semibold text-ink">{inv.title}</p>
                    <p className="text-mut">
                      Customer: {inv.customerName}
                      {inv.discountNote ? ` · ${inv.discountNote}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-serif text-base font-semibold tabular-nums text-ink">
                      {formatMinorGBP(inv.subtotalMinor)}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 font-bold",
                        inv.status === "released"
                          ? "bg-mint text-mint-d"
                          : inv.status === "paid_held" || inv.status === "delivered"
                            ? "bg-sky text-sky-d"
                            : "bg-butter text-butter-d",
                      )}
                    >
                      {inv.status === "sent"
                        ? "Awaiting payment"
                        : inv.status === "paid_held"
                          ? "Held by Servyn"
                          : inv.status === "delivered"
                            ? "Dispatched"
                            : "Released"}
                    </span>
                    {inv.status === "paid_held" ? (
                      <button
                        type="button"
                        onClick={() => markInvoiceDelivered(inv.id)}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-leaf-800 px-3.5 py-1.5 font-semibold text-cream hover:bg-leaf-700"
                      >
                        <Truck className="size-3.5" aria-hidden="true" />
                        <span>Mark dispatched</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
