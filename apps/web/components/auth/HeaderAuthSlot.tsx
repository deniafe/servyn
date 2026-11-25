"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, UserButton } from "@clerk/nextjs";
import type { RoleContext } from "@servyn/shared";
import { RoleSwitcher } from "@/components/auth/RoleSwitcher";
import { servynClerkAppearance } from "@/lib/clerk-appearance";

interface MeSummary {
  ok: boolean;
  roles?: RoleContext[];
  activeRole?: RoleContext;
}

export function HeaderAuthSlot() {
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();
  const [roles, setRoles] = React.useState<RoleContext[]>(["customer"]);
  const [activeRole, setActiveRole] = React.useState<RoleContext>("customer");
  const [syncDegraded, setSyncDegraded] = React.useState(false);

  React.useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;
    fetch("/api/v1/me")
      .then((res) => (res.ok ? (res.json() as Promise<MeSummary>) : null))
      .then((data) => {
        if (cancelled || !data?.ok) return;
        setSyncDegraded(false);
        if (data.roles && data.roles.length > 0) setRoles(data.roles);
        if (data.activeRole) setActiveRole(data.activeRole);
      })
      .catch(() => {
        if (cancelled) return;
        setRoles(["customer"]);
        setActiveRole("customer");
        setSyncDegraded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, pathname]);

  if (!isLoaded) {
    return <div className="h-9 w-28 rounded-full bg-cream/10" aria-hidden="true" />;
  }

  if (!isSignedIn) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/sign-up?intent=vendor"
          className="hidden rounded-full px-3 py-1.5 text-xs font-semibold text-cream-85 transition-colors hover:text-gold-300 lg:inline-flex"
        >
          Become a vendor
        </Link>
        <Link
          href="/sign-in"
          className="rounded-full border border-gold-45 px-3.5 py-1.5 text-xs font-semibold text-cream transition-colors hover:bg-cream/10"
        >
          Sign in
        </Link>
        <Link
          href="/sign-up"
          className="rounded-full bg-linear-to-b from-grad-gold-1 to-grad-gold-2 px-3.5 py-1.5 text-xs font-semibold text-gold-ink shadow-gold transition-all hover:brightness-105"
        >
          Join
        </Link>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2.5"
      data-auth-degraded={syncDegraded ? "true" : undefined}
    >
      <div className="hidden sm:block">
        <RoleSwitcher roles={roles} activeRole={activeRole} />
      </div>
      <Link
        href="/dashboard"
        className="hidden rounded-full border border-cream-line px-3 py-1 text-xs font-semibold text-cream-85 transition-colors hover:bg-cream/10 md:inline-flex"
      >
        Dashboard
      </Link>
      <UserButton appearance={servynClerkAppearance} />
    </div>
  );
}
