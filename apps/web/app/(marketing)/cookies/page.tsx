import type { Metadata } from "next";
import { Cookie } from "lucide-react";
import { CookiePreferencesTrigger } from "@/components/home/CookiePreferencesTrigger";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteHeader } from "@/components/home/SiteHeader";

export const metadata: Metadata = {
  title: "Cookie Policy — Servyn",
  description: "How Servyn uses essential and consent-gated cookies under UK PECR.",
};

export default function CookiesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream text-ink">
      <SiteHeader />
      <main className="flex-1 pt-[var(--sv-hdr-h)]">
        <section className="bg-leaf-900 py-12 text-cream">
          <div className="mx-auto max-w-[900px] px-6 lg:px-8">
            <span className="inline-block rounded-full bg-gold-200 px-3 py-1 text-[11.5px] font-bold text-gold-ink">
              UK PECR Compliance
            </span>
            <h1 className="mt-3 font-serif text-3xl font-medium sm:text-4xl">Cookie Policy</h1>
            <p className="mt-2 text-sm text-cream-75">
              Essential cookies keep your session secure; optional analytics only load with your
              consent.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-[900px] space-y-5 px-6 py-10 text-sm leading-relaxed text-ink-2 lg:px-8">
          <div className="rounded-[18px] border border-line bg-surface p-6 shadow-soft">
            <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-ink">
              <Cookie className="size-5 text-leaf-700" aria-hidden="true" />
              <span>Cookies We Use</span>
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <strong>Strictly necessary:</strong> Authentication session cookies (Clerk), CSRF
                and bot-protection checks, and your cookie preference record.
              </li>
              <li>
                <strong>Optional analytics (PostHog EU):</strong> Disabled by default. Only enabled
                if you explicitly accept analytics cookies.
              </li>
              <li>
                <strong>Optional map tiles:</strong> Loaded only when you opt in or view interactive
                Manchester service area maps.
              </li>
            </ul>
            <div className="mt-5 inline-flex rounded-full bg-leaf-900 px-4 py-2 text-xs text-cream">
              <CookiePreferencesTrigger />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
