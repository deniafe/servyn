import Link from "next/link";
import { SignOutButton } from "@clerk/nextjs";
import { AlertTriangle, Mail } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";

export default function SuspendedPage() {
  return (
    <AuthShell
      badge="Account restricted"
      badgeTone="blush"
      title="Your account is suspended"
      subtitle="Access to bookings, payouts, and messaging is paused while our Trust & Safety team reviews this account."
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-md border border-line bg-surface-2 p-4 text-sm text-ink-2">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-blush-d" aria-hidden="true" />
          <p className="leading-relaxed">
            If you believe this was in error or would like to submit an appeal, contact our support
            team with your registered email address.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row">
          <a
            href="mailto:support@servyn.co.uk?subject=Account%20Appeal"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-leaf-800 px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-leaf-700"
          >
            <Mail className="size-4" aria-hidden="true" />
            <span>Submit appeal</span>
          </a>
          <SignOutButton redirectUrl="/">
            <button
              type="button"
              className="inline-flex flex-1 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-line-2 px-5 py-2.5 text-sm font-semibold text-ink-2 transition-colors hover:border-leaf-500 hover:bg-leaf-50"
            >
              Sign out
            </button>
          </SignOutButton>
        </div>

        <p className="text-center text-xs text-mut">
          <Link href="/" className="font-semibold text-leaf-600 hover:text-leaf-700">
            Return to Servyn homepage
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
