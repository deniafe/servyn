import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { AdminConsoleClient } from "@/components/demo/AdminConsoleClient";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteHeader } from "@/components/home/SiteHeader";

export const metadata: Metadata = {
  title: "Admin Operations Demo — Servyn",
  description:
    "Investor demo preview of the Servyn Operations Console for vendor approvals and dispute resolution.",
};

export default function AdminDemoPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream text-ink">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1240px] flex-1 space-y-5 px-6 pt-[calc(var(--sv-hdr-h)+28px)] pb-14 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gold-300 bg-gold-50 px-4 py-2.5 text-xs text-ink-2">
          <span className="inline-flex items-center gap-2 font-semibold">
            <ShieldCheck className="size-4 text-leaf-700" aria-hidden="true" />
            <span>
              Investor demo preview — Admin Operations Console (production /admin requires MFA +
              admin role).
            </span>
          </span>
        </div>
        <AdminConsoleClient adminEmail="founder@servyn.net" isDemoPreview />
      </main>
      <SiteFooter />
    </div>
  );
}
