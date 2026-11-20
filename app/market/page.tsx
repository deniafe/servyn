import type { Metadata } from "next";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteHeader } from "@/components/home/SiteHeader";
import { MarketCatalogue } from "@/components/market/MarketCatalogue";

export const metadata: Metadata = {
  title: "The African Market — Servyn",
  description:
    "Shop retail and wholesale Afro-Caribbean textiles, raw shea butter, pantry spices, and crafts directly from Manchester sellers.",
};

export default function MarketPage() {
  return (
    <div id="top" className="flex min-h-screen flex-col bg-cream text-ink">
      <SiteHeader />

      <main className="flex-1 pt-[var(--sv-hdr-h)]">
        <MarketCatalogue />
      </main>

      <SiteFooter />
    </div>
  );
}
