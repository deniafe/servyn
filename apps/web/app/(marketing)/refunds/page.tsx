import Link from "next/link";
import { RotateCcw, ShieldCheck } from "lucide-react";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteHeader } from "@/components/home/SiteHeader";

export default function RefundsPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream text-ink">
      <SiteHeader />
      <main className="flex-1 pt-[var(--sv-hdr-h)]">
        <section className="bg-leaf-900 py-12 text-cream">
          <div className="mx-auto max-w-[900px] px-6 lg:px-8">
            <span className="inline-block rounded-full bg-gold-200 px-3 py-1 text-[11.5px] font-bold text-gold-ink">
              Policies &amp; Protections
            </span>
            <h1 className="mt-3 font-serif text-3xl font-medium sm:text-4xl">
              Cancellation, Refund &amp; Protected Payment Policy
            </h1>
            <p className="mt-2 text-sm text-cream-75">
              Clear rules pinned at booking time — governed by the laws of England &amp; Wales.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-[900px] space-y-6 px-6 py-10 lg:px-8">
          <div className="rounded-[18px] border border-line bg-surface p-6 shadow-soft">
            <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-ink">
              <ShieldCheck className="size-5 text-leaf-700" aria-hidden="true" />
              <span>How Protected Payments Work (Not Escrow)</span>
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">
              When you pay for a service or product on Servyn via Stripe, your payment is held
              within Servyn&apos;s protected-payment flow (not escrow) until you confirm the service
              was delivered or goods arrived satisfactorily. If a problem is reported, payout is
              paused immediately for human review.
            </p>
          </div>

          <div className="rounded-[18px] border border-line bg-surface p-6 shadow-soft">
            <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-ink">
              <RotateCcw className="size-5 text-gold-600" aria-hidden="true" />
              <span>Service Cancellation Tiers</span>
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-line bg-mint/40 p-4">
                <p className="text-xs font-bold uppercase text-mint-d">48+ hours before</p>
                <p className="mt-1 font-serif text-lg font-semibold text-ink">100% Refund</p>
                <p className="mt-1 text-xs text-mut">Full refund including the Servyn fee.</p>
              </div>
              <div className="rounded-md border border-line bg-butter/50 p-4">
                <p className="text-xs font-bold uppercase text-butter-d">24–48 hours before</p>
                <p className="mt-1 font-serif text-lg font-semibold text-ink">50% Refund</p>
                <p className="mt-1 text-xs text-mut">Fair split to protect the provider&apos;s slot.</p>
              </div>
              <div className="rounded-md border border-line bg-surface-2 p-4">
                <p className="text-xs font-bold uppercase text-mut">Under 24 hours</p>
                <p className="mt-1 font-serif text-lg font-semibold text-ink">No automatic refund</p>
                <p className="mt-1 text-xs text-mut">Human review available for emergencies.</p>
              </div>
              <div className="rounded-md border border-line bg-mint/40 p-4">
                <p className="text-xs font-bold uppercase text-mint-d">Vendor cancels / no-show</p>
                <p className="mt-1 font-serif text-lg font-semibold text-ink">100% Refund</p>
                <p className="mt-1 text-xs text-mut">Always refunded in full to your card.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-between rounded-[18px] border border-line bg-surface p-6 text-sm shadow-soft">
            <span className="text-mut">Need to report an issue on an active booking?</span>
            <Link href="/dashboard" className="font-semibold text-leaf-700 hover:underline">
              Open your dashboard →
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
