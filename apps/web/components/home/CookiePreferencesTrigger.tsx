"use client";

import { openCookiePreferences } from "@/lib/consent";

export function CookiePreferencesTrigger({
  label = "Cookie preferences",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => openCookiePreferences()}
      className={
        className ??
        "cursor-pointer text-left text-[13.5px] text-cream-60 transition-colors hover:text-cream"
      }
    >
      {label}
    </button>
  );
}
