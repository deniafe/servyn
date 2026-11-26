import type { Metadata } from "next";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteHeader } from "@/components/home/SiteHeader";
import { AiMatchClient } from "@/components/demo/AiMatchClient";

export const metadata: Metadata = {
  title: "AI Service Matching — Servyn",
  description:
    "Describe what you need in plain English and get grounded matches from verified Afro-Caribbean providers in Manchester.",
};

export default function AiMatchPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream text-ink">
      <SiteHeader />
      <main className="flex-1 pt-[var(--sv-hdr-h)]">
        <AiMatchClient />
      </main>
      <SiteFooter />
    </div>
  );
}
