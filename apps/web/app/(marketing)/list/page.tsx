import type { Metadata } from "next";
import { Suspense } from "react";
import { ListItemClient } from "@/components/demo/ListItemClient";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteHeader } from "@/components/home/SiteHeader";

export const metadata: Metadata = {
  title: "List a Service or Product — Servyn",
  description:
    "Publish your service or African market product live to Manchester customers with Stripe protected payments.",
};

export default function ListPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream text-ink">
      <SiteHeader />
      <main className="flex-1 pt-[var(--sv-hdr-h)]">
        <Suspense fallback={<div className="mx-auto max-w-[720px] p-8" />}>
          <ListItemClient />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
