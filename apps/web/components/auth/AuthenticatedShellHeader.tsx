"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Menu, Plus, X } from "lucide-react";
import type { RoleContext } from "@servyn/shared";
import { RoleSwitcher } from "@/components/auth/RoleSwitcher";
import { servynClerkAppearance } from "@/lib/clerk-appearance";
import { cn } from "@/lib/utils";

export interface AuthenticatedShellHeaderProps {
  roles: RoleContext[];
  activeRole: RoleContext;
}

const SHELL_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/services", label: "Services" },
  { href: "/market", label: "Market" },
  { href: "/messages", label: "Messages" },
  { href: "/account", label: "Account" },
] as const;

export function AuthenticatedShellHeader({ roles, activeRole }: AuthenticatedShellHeaderProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-[100] bg-leaf-900 text-cream shadow-soft">
      <div aria-hidden="true" className="h-1.5 w-full" style={{ background: "var(--sv-kente)" }} />
      <div className="mx-auto flex h-[calc(var(--sv-hdr-h)-6px)] max-w-[1240px] items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6">
        <div className="flex items-center gap-4 lg:gap-6">
          <Link
            href="/"
            aria-label="Servyn home"
            className="font-serif text-[22px] leading-none font-[650] tracking-[-0.01em] text-cream sm:text-[25px]"
          >
            Serv<em className="not-italic text-gold-400">yn</em>
          </Link>

          <nav aria-label="Shell navigation" className="hidden items-center gap-4 md:flex">
            {SHELL_LINKS.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "border-b-2 py-1 text-[14px] font-semibold transition-colors",
                    isActive
                      ? "border-gold-400 text-gold-400"
                      : "border-transparent text-cream-75 hover:text-cream",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <Link
            href="/list"
            className="hidden shrink-0 whitespace-nowrap rounded-full bg-linear-to-b from-grad-gold-1 to-grad-gold-2 px-3 py-1.5 text-xs font-bold text-gold-ink shadow-gold hover:brightness-105 sm:inline-flex"
          >
            + List
          </Link>
          <RoleSwitcher roles={roles} activeRole={activeRole} />
          <UserButton appearance={servynClerkAppearance} />
          <button
            type="button"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg text-cream-85 hover:bg-cream/10 hover:text-gold-300 md:hidden"
          >
            {mobileOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <nav
          aria-label="Mobile shell navigation"
          className="border-t border-cream-line bg-leaf-950 px-4 py-3 md:hidden"
        >
          <div className="flex flex-col gap-1">
            {SHELL_LINKS.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-leaf-800 text-gold-300"
                      : "text-cream-85 hover:bg-leaf-900 hover:text-cream",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/list"
              onClick={() => setMobileOpen(false)}
              className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-linear-to-b from-grad-gold-1 to-grad-gold-2 px-4 py-2 text-xs font-bold text-gold-ink shadow-gold"
            >
              <Plus className="size-3.5" aria-hidden="true" />
              <span>List a service or product</span>
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
