import type { Metadata } from "next";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteHeader } from "@/components/home/SiteHeader";
import { ServicesDirectory } from "@/components/services/ServicesDirectory";

export const metadata: Metadata = {
  title: "Services in Manchester — Servyn",
  description:
    "Browse verified African and Afro-Caribbean service providers across Manchester with transparent starting prices and protected payment.",
};

export default function ServicesPage() {
  return (
    <div id="top" className="flex min-h-screen flex-col bg-cream text-ink">
      <SiteHeader />

      <main className="flex-1 pt-[var(--sv-hdr-h)]">
        <ServicesDirectory />
      </main>

      <SiteFooter />
    </div>
  );
}
