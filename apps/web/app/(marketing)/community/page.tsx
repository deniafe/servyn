import type { Metadata } from "next";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteHeader } from "@/components/home/SiteHeader";
import { CommunityFeedClient } from "@/components/demo/CommunityFeedClient";

export const metadata: Metadata = {
  title: "Servyn Community — Manchester",
  description:
    "Share experiences, ask for recommendations, and connect with Afro-Caribbean businesses across Manchester.",
};

export default function CommunityPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream text-ink">
      <SiteHeader />
      <main className="flex-1 pt-[var(--sv-hdr-h)]">
        <CommunityFeedClient />
      </main>
      <SiteFooter />
    </div>
  );
}
