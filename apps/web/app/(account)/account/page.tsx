import { Suspense } from "react";
import Link from "next/link";
import { SignOutButton } from "@clerk/nextjs";
import { CheckCircle2, FileText, Lock, ShieldCheck, Users } from "lucide-react";
import { CookiePreferencesTrigger } from "@/components/home/CookiePreferencesTrigger";
import { requireAuth } from "@/lib/auth";

async function AccountContent() {
  const session = await requireAuth();
  const { identity, hasMfa } = session;
  const displayName = identity.customerProfile?.displayName ?? "Servyn Member";
  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "SM";

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-line bg-surface p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="flex size-14 shrink-0 items-center justify-center rounded-[15px] font-serif text-xl font-bold text-gold-ink"
              style={{ background: "var(--sv-grad-avatar)" }}
            >
              {initials}
            </div>
            <div>
              <h1 className="font-serif text-2xl font-semibold text-ink sm:text-[28px]">
                Welcome back, {displayName}
              </h1>
              <p className="text-sm text-mut">{identity.user.email}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {identity.roles.map((role) => (
                  <span
                    key={role}
                    className="rounded-full bg-mint px-2.5 py-0.5 text-[11.5px] font-bold capitalize text-mint-d"
                  >
                    {role}
                  </span>
                ))}
                <span className="rounded-full bg-mint px-2.5 py-0.5 text-[11.5px] font-bold text-mint-d">
                  Active
                </span>
              </div>
            </div>
          </div>

          <SignOutButton redirectUrl="/">
            <button
              type="button"
              className="cursor-pointer rounded-full border-[1.5px] border-line-2 px-4 py-2 text-xs font-semibold text-ink-2 transition-colors hover:border-leaf-500 hover:bg-leaf-50"
            >
              Sign out
            </button>
          </SignOutButton>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-line bg-surface p-6 shadow-soft">
          <h2 className="flex items-center gap-2 font-serif text-lg font-semibold text-ink">
            <ShieldCheck className="size-5 text-gold-600" aria-hidden="true" />
            <span>Verification &amp; Security</span>
          </h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-md border border-line bg-surface-2 p-3.5">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-4 text-leaf-600" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-ink">Email verified</p>
                  <p className="text-xs text-mut">{identity.user.email}</p>
                </div>
              </div>
              <span className="rounded-full bg-mint px-2.5 py-0.5 text-[11.5px] font-bold text-mint-d">
                Done
              </span>
            </div>

            <div className="flex items-center justify-between rounded-md border border-line bg-surface-2 p-3.5">
              <div className="flex items-center gap-3">
                <Lock className="size-4 text-gold-600" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-ink">Two-factor authentication</p>
                  <p className="text-xs text-mut">
                    Optional for customers, vendors &amp; sellers; required for admin
                  </p>
                </div>
              </div>
              {hasMfa ? (
                <span className="rounded-full bg-mint px-2.5 py-0.5 text-[11.5px] font-bold text-mint-d">
                  Active
                </span>
              ) : (
                <Link
                  href="/mfa-required?redirect_url=/account"
                  className="rounded-full bg-leaf-800 px-3 py-1 text-xs font-semibold text-cream hover:bg-leaf-700"
                >
                  Enable
                </Link>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-5 rounded-lg border border-line bg-surface p-6 shadow-soft">
          <div>
            <h2 className="flex items-center gap-2 font-serif text-lg font-semibold text-ink">
              <Users className="size-5 text-gold-600" aria-hidden="true" />
              <span>Roles &amp; preferences</span>
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-mut">
              One account, many roles: a stylist can book a tailor; a childminder can order Jollof.
              Add a role without creating a new login.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/onboarding/vendor"
                className="rounded-full bg-leaf-800 px-3.5 py-1.5 text-xs font-semibold text-cream hover:bg-leaf-700"
              >
                {identity.roles.includes("vendor")
                  ? "Vendor onboarding"
                  : "Become a service vendor"}
              </Link>
              <Link
                href="/onboarding/seller"
                className="rounded-full border-[1.5px] border-line-2 px-3.5 py-1.5 text-xs font-semibold text-ink-2 hover:border-leaf-500 hover:bg-leaf-50"
              >
                {identity.roles.includes("seller")
                  ? "Seller onboarding"
                  : "Become a product seller"}
              </Link>
            </div>
          </div>

          <div className="border-t border-line pt-4">
            <h3 className="flex items-center gap-2 font-serif text-base font-semibold text-ink">
              <FileText className="size-4 text-gold-600" aria-hidden="true" />
              <span>Data &amp; privacy (UK GDPR)</span>
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-mut">
              Your data is yours. Downloadable export &amp; self-service account erasure workflows
              will be connected in the GDPR unit.
            </p>
            <div className="mt-3">
              <CookiePreferencesTrigger
                label="Manage cookie preferences"
                className="cursor-pointer rounded-full border-[1.5px] border-line-2 px-3.5 py-1.5 text-xs font-semibold text-ink-2 transition-colors hover:border-leaf-500 hover:bg-leaf-50"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="h-64 rounded-lg bg-surface" />}>
      <AccountContent />
    </Suspense>
  );
}
