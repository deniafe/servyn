import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Lock, ShieldCheck } from "lucide-react";

export interface AuthShellProps {
  badge?: string;
  badgeTone?: "gold" | "blush" | "mint";
  title: string;
  subtitle: string;
  quote?: string;
  quoteAuthor?: string;
  children: ReactNode;
  maxWidthClass?: string;
}

const BADGE_CLASSES: Record<NonNullable<AuthShellProps["badgeTone"]>, string> = {
  gold: "bg-gold-100 text-butter-d border border-gold-300",
  blush: "bg-blush text-blush-d",
  mint: "bg-mint text-mint-d",
};

export function AuthShell({
  badge,
  badgeTone = "gold",
  title,
  subtitle,
  quote = "I found my braider, my tailor and my caterer in one place. Rebooking is one tap.",
  quoteAuthor = "Ada O. · Hulme",
  children,
  maxWidthClass = "max-w-[460px]",
}: AuthShellProps) {
  return (
    <div className="min-h-screen grid bg-cream lg:grid-cols-[44%_1fr]">
      {/* Left Brand Panel */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-leaf-900 text-cream lg:flex">
        <div
          aria-hidden="true"
          className="h-1.5 w-full shrink-0"
          style={{ background: "var(--sv-kente)" }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: "var(--sv-diamond-pattern)" }}
        />

        <div className="relative z-10 flex flex-1 flex-col justify-between px-10 py-10">
          <div className="space-y-8">
            <Link
              href="/"
              aria-label="Servyn home"
              className="inline-flex items-baseline font-serif text-[29px] font-[650] tracking-[-0.01em] text-cream"
            >
              Serv<em className="not-italic text-gold-400">yn</em>
            </Link>

            <p className="max-w-sm font-serif text-3xl leading-[1.12] font-medium italic text-gold-300">
              For the community, by the community.
            </p>

            <blockquote className="rounded-md border border-cream-line bg-cream/5 p-5">
              <p className="text-sm leading-relaxed text-cream-85 italic">&ldquo;{quote}&rdquo;</p>
              <footer className="mt-3 text-xs font-semibold text-gold-300">{quoteAuthor}</footer>
            </blockquote>

            <ul className="space-y-3.5 text-sm text-cream-85">
              <li className="flex items-center gap-3">
                <ShieldCheck className="size-4 shrink-0 text-gold-400" aria-hidden="true" />
                <span>Protected payments — released when the job&apos;s done</span>
              </li>
              <li className="flex items-center gap-3">
                <BadgeCheck className="size-4 shrink-0 text-gold-400" aria-hidden="true" />
                <span>Verified providers · enhanced childcare checks</span>
              </li>
              <li className="flex items-center gap-3">
                <Lock className="size-4 shrink-0 text-gold-400" aria-hidden="true" />
                <span>Stripe-held protected payments on every booking &amp; order</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 flex items-center justify-between gap-4">
            <div className="inline-flex items-center gap-3 rounded-md border border-gold-25 bg-surface px-4 py-3 text-ink shadow-soft">
              <span className="flex size-8 items-center justify-center rounded-sm bg-gold-100 text-butter-d">
                <ShieldCheck className="size-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-bold text-ink">Protected payments</p>
                <p className="text-[11px] text-mut">Held in Stripe until confirmed</p>
              </div>
            </div>
            <span className="text-xs text-cream-60">Manchester first</span>
          </div>
        </div>
      </aside>

      {/* Right Cream Canvas */}
      <main className="flex min-h-screen flex-col bg-cream">
        {/* Compact Mobile Brand Strip */}
        <div className="bg-leaf-900 text-cream lg:hidden">
          <div
            aria-hidden="true"
            className="h-1.5 w-full"
            style={{ background: "var(--sv-kente)" }}
          />
          <div className="flex items-center justify-between px-4 py-3">
            <Link href="/" className="font-serif text-xl font-[650] tracking-[-0.01em] text-cream">
              Serv<em className="not-italic text-gold-400">yn</em>
            </Link>
            <span className="text-xs text-cream-75">Manchester first</span>
          </div>
        </div>

        {/* Top Utility Bar */}
        <div className="flex items-center justify-between px-6 py-4 text-sm text-ink-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-medium text-ink-2 transition-colors hover:text-leaf-700"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>Back to Servyn</span>
          </Link>
          <Link
            href="/#how-it-works"
            className="font-medium text-mut transition-colors hover:text-leaf-700"
          >
            Help
          </Link>
        </div>

        {/* Centered Card */}
        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
          <div
            className={`w-full ${maxWidthClass} rounded-lg border border-line bg-surface p-6 shadow-soft sm:p-8`}
          >
            {badge ? (
              <span
                className={`mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-bold ${BADGE_CLASSES[badgeTone]}`}
              >
                {badge}
              </span>
            ) : null}
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">
              {title}
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-mut">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
