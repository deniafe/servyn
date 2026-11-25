"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { RoleContext } from "@servyn/shared";

export interface RoleSwitcherProps {
  roles: RoleContext[];
  activeRole: RoleContext;
}

const ROLE_LABELS: Record<RoleContext, string> = {
  customer: "Customer",
  vendor: "Vendor",
  seller: "Seller",
  admin: "Admin",
};

const ROLE_DESTINATIONS: Record<RoleContext, string> = {
  customer: "/dashboard",
  vendor: "/vendor",
  seller: "/seller",
  admin: "/admin",
};

export function RoleSwitcher({ roles, activeRole }: RoleSwitcherProps) {
  const router = useRouter();
  const [optimisticRole, setOptimisticRole] = React.useState<RoleContext | null>(null);
  const [switching, setSwitching] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const current = switching && optimisticRole ? optimisticRole : activeRole;

  async function handleSelect(role: RoleContext) {
    if (switching) return;
    setErrorMessage(null);
    setOptimisticRole(role);
    setSwitching(true);
    try {
      const res = await fetch("/api/v1/auth/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        router.push(ROLE_DESTINATIONS[role]);
        router.refresh();
      } else {
        setOptimisticRole(null);
        setErrorMessage("Could not switch role");
      }
    } catch {
      setOptimisticRole(null);
      setErrorMessage("Network error");
    } finally {
      setSwitching(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <div
        role="group"
        aria-label="Active role context"
        className="inline-flex items-center rounded-full border border-cream-line bg-leaf-950 p-0.5"
      >
        {roles.map((role) => {
          const isActive = role === current;
          return (
            <button
              key={role}
              type="button"
              disabled={switching}
              onClick={() => void handleSelect(role)}
              aria-pressed={isActive}
              className={`cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-linear-to-b from-grad-gold-1 to-grad-gold-2 text-gold-ink shadow-gold"
                  : "text-cream-75 hover:text-cream"
              }`}
            >
              {ROLE_LABELS[role]}
            </button>
          );
        })}
      </div>
      {errorMessage ? (
        <span role="alert" className="text-[11px] font-semibold text-gold-300">
          {errorMessage}
        </span>
      ) : null}
    </div>
  );
}
