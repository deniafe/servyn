"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import type { RoleContext } from "@servyn/shared";
import { RoleSwitcher } from "@/components/auth/RoleSwitcher";
import { servynClerkAppearance } from "@/lib/clerk-appearance";

export interface AuthenticatedShellHeaderProps {
  roles: RoleContext[];
  activeRole: RoleContext;
}

const SHELL_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/services", label: "Services" },
  { href: "/market", label: "Market" },
  { href: "/account", label: "Account" },
] as const;

export function AuthenticatedShellHeader({ roles, activeRole }: AuthenticatedShellHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-[100] bg-leaf-900 text-cream shadow-soft">
      <div aria-hidden="true" className="h-1.5 w-full" style={{ background: "var(--sv-kente)" }} />
      <div className="mx-auto flex h-[calc(var(--sv-hdr-h)-6px)] max-w-[1240px] items-center justify-between gap-4 px-6 max-[720px]:px-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            aria-label="Servyn home"
            className="font-serif text-[25px] leading-none font-[650] tracking-[-0.01em] text-cream"
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
                  className={`border-b-2 py-1 text-[14px] font-semibold transition-colors ${
                    isActive
                      ? "border-gold-400 text-gold-400"
                      : "border-transparent text-cream-75 hover:text-cream"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/list"
            className="shrink-0 whitespace-nowrap rounded-full bg-linear-to-b from-grad-gold-1 to-grad-gold-2 px-3 py-1.5 text-xs font-bold text-gold-ink shadow-gold hover:brightness-105"
          >
            + List
          </Link>
          <RoleSwitcher roles={roles} activeRole={activeRole} />
          <UserButton appearance={servynClerkAppearance} />
        </div>
      </div>
    </header>
  );
}
