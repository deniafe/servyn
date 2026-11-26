import type { Metadata } from "next";
import { ContactFormClient } from "@/components/demo/ContactFormClient";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteHeader } from "@/components/home/SiteHeader";

export const metadata: Metadata = {
  title: "Contact Us — Servyn",
  description: "Get in touch with the Servyn Manchester team for bookings, vendors, or investor enquiries.",
};

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream text-ink">
      <SiteHeader />
      <main className="flex-1 pt-[var(--sv-hdr-h)]">
        <section className="bg-leaf-900 py-12 text-center text-cream">
          <div className="mx-auto max-w-[700px] px-6">
            <span className="inline-block rounded-full bg-gold-200 px-3 py-1 text-[11.5px] font-bold text-gold-ink">
              Get in Touch
            </span>
            <h1 className="mt-3 font-serif text-3xl font-medium sm:text-4xl">Contact Servyn</h1>
            <p className="mt-2 text-sm text-cream-75">
              Manchester support, vendor onboarding help, and investor enquiries.
            </p>
          </div>
        </section>
        <ContactFormClient />
      </main>
      <SiteFooter />
    </div>
  );
}
