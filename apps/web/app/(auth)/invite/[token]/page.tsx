import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";

export default async function InviteClaimPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <AuthShell
      badge="Manchester Founding Cohort"
      badgeTone="mint"
      title="Claim your Servyn profile"
      subtitle="You've been invited to join Servyn's Manchester launch cohort. Sign in or create your account to link this invitation."
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-md border border-line bg-surface-2 p-4 text-xs text-ink-2">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-gold-600" aria-hidden="true" />
          <div>
            <p className="font-semibold text-ink">Invitation token detected</p>
            <p className="mt-0.5 text-mut">
              Reference: <span className="font-semibold text-ink-2">{token}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <Link
            href={`/sign-up?redirect_url=${encodeURIComponent("/onboarding?intent=vendor")}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-linear-to-b from-grad-gold-1 to-grad-gold-2 px-5 py-3 text-sm font-semibold text-gold-ink shadow-gold transition-all hover:brightness-105"
          >
            <span>Create account &amp; claim</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link
            href={`/sign-in?redirect_url=${encodeURIComponent("/onboarding?intent=vendor")}`}
            className="inline-flex w-full items-center justify-center rounded-full border-[1.5px] border-line-2 px-5 py-2.5 text-sm font-semibold text-ink-2 transition-colors hover:border-leaf-500 hover:bg-leaf-50"
          >
            I already have a Servyn account
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
