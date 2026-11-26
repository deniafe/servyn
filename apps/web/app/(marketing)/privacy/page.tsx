import Link from "next/link";
import { Lock } from "lucide-react";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteHeader } from "@/components/home/SiteHeader";

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream text-ink">
      <SiteHeader />
      <main className="flex-1 pt-[var(--sv-hdr-h)]">
        <section className="bg-leaf-900 py-12 text-cream">
          <div className="mx-auto max-w-[900px] px-6 lg:px-8">
            <span className="inline-block rounded-full bg-gold-200 px-3 py-1 text-[11.5px] font-bold text-gold-ink">
              UK GDPR &amp; PECR
            </span>
            <h1 className="mt-3 font-serif text-3xl font-medium sm:text-4xl">
              Privacy &amp; Your Data
            </h1>
            <p className="mt-2 text-sm text-cream-75">
              UK/EU data residency, consent-first analytics, and full data portability.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-[900px] space-y-5 px-6 py-10 text-sm leading-relaxed text-ink-2 lg:px-8">
          <div className="rounded-[18px] border border-line bg-surface p-6 shadow-soft">
            <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-ink">
              <Lock className="size-5 text-leaf-700" aria-hidden="true" />
              <span>Your UK GDPR Rights on Servyn</span>
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <strong>Data portability (Article 20):</strong> Vendors and sellers can download a
                full PDF export of their account, listings, payment ledger, and conversations from
                their dashboard at any time.
              </li>
              <li>
                <strong>Consent-gated analytics (PECR):</strong> Non-essential analytics (PostHog
                EU) never run until you opt in via Cookie Preferences.
              </li>
              <li>
                <strong>Privacy by default:</strong> Provider home addresses are never exposed
                publicly — listings show service areas only. Card numbers are processed solely by
                Stripe.
              </li>
              <li>
                <strong>AI Match minimisation:</strong> Only your search query and public listing
                fields are used for AI Match — never personal contact or payment data.
              </li>
            </ul>
            <div className="mt-5">
              <Link href="/account" className="font-semibold text-leaf-700 hover:underline">
                Manage your security &amp; cookie preferences →
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
