import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteHeader } from "@/components/home/SiteHeader";

export const metadata: Metadata = {
  title: "Terms & Conditions — Servyn",
  description:
    "UK marketplace terms, protected payment rules, platform fees, and dispute resolution on Servyn.",
};

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream text-ink">
      <SiteHeader />
      <main className="flex-1 pt-[var(--sv-hdr-h)]">
        <section className="bg-leaf-900 py-12 text-cream">
          <div className="mx-auto max-w-[900px] px-6 lg:px-8">
            <span className="inline-block rounded-full bg-gold-200 px-3 py-1 text-[11.5px] font-bold text-gold-ink">
              UK Marketplace Terms
            </span>
            <h1 className="mt-3 font-serif text-3xl font-medium sm:text-4xl">
              Terms &amp; Conditions
            </h1>
            <p className="mt-2 text-sm text-cream-75">
              Clear rules for customers, service vendors, and market sellers on Servyn.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-[900px] space-y-5 px-6 py-10 text-sm leading-relaxed text-ink-2 lg:px-8">
          <div className="rounded-[18px] border border-line bg-surface p-6 shadow-soft">
            <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-ink">
              <ShieldCheck className="size-5 text-leaf-700" aria-hidden="true" />
              <span>Protected Payments &amp; Marketplace Role</span>
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <strong>Protected payment (not escrow):</strong> Customer payments are processed
                via Stripe and held within Servyn until the customer confirms satisfactory delivery
                of the service or goods, or until an open dispute is resolved.
              </li>
              <li>
                <strong>Transparent 10% booking fee:</strong> Servyn adds a 10% platform fee on top
                of the provider&apos;s agreed price (or 5% when an active referral reward applies).
                Vendors and sellers receive 100% of their agreed price upon release.
              </li>
              <li>
                <strong>Independent providers:</strong> Vendors and sellers are independent
                businesses. Servyn verifies identity and stated credentials where applicable, but
                does not employ providers.
              </li>
              <li>
                <strong>Disputes &amp; pauses:</strong> If a service or order is not delivered as
                agreed, customers can pause payout release from their dashboard so a Servyn reviewer
                can inspect the chat and invoice audit trail.
              </li>
            </ul>
          </div>

          <div className="rounded-[18px] border border-line bg-surface p-6 shadow-soft">
            <h2 className="font-serif text-xl font-semibold text-ink">
              Company Information
            </h2>
            <p className="mt-2 text-ink-2">
              Servyn is operated by <strong>SERVYN LTD</strong> (Company No.{" "}
              <strong>17603157</strong>), incorporated in England and Wales on 26 November 2026.
            </p>
            <p className="mt-1 text-mut">
              Registered office: 5, Queens Chambers, John Dalton Street, Manchester, United Kingdom,
              M2 6ET.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
