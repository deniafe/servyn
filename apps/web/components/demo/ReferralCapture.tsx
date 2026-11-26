"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Gift, X } from "lucide-react";
import { activateReferralDiscount } from "@/lib/demo-flow-store";

export function ReferralCapture() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const refParam = searchParams.get("ref");
  const [bannerVisible, setBannerVisible] = React.useState(false);

  React.useEffect(() => {
    if (!refParam || !/^[A-Za-z0-9_-]{3,128}$/.test(refParam)) return;
    activateReferralDiscount();
    const next = new URLSearchParams(searchParams.toString());
    next.delete("ref");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    const frame = window.requestAnimationFrame(() => setBannerVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, [refParam, pathname, router, searchParams]);

  if (!bannerVisible) return null;

  return (
    <div
      role="status"
      className="fixed right-4 bottom-4 z-[95] flex max-w-sm items-center gap-3 rounded-xl border border-gold-400/50 bg-leaf-950 px-4 py-3 text-xs text-cream shadow-lift"
    >
      <Gift className="size-4 shrink-0 text-gold-400" aria-hidden="true" />
      <p className="flex-1 leading-snug">
        <strong className="text-gold-300">Invite applied!</strong> You have 5% off Servyn&apos;s
        booking fee on your next Stripe checkout.
      </p>
      <button
        type="button"
        onClick={() => setBannerVisible(false)}
        aria-label="Dismiss referral notice"
        className="cursor-pointer rounded p-1 text-cream-60 hover:text-cream"
      >
        <X className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
