import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { CustomSignUpForm } from "@/components/auth/CustomSignUpForm";

type SignUpIntent = "customer" | "vendor" | "seller";

const INTENT_META: Record<
  SignUpIntent,
  {
    label: string;
    badge: string;
    title: string;
    subtitle: string;
    redirectTo: string;
    quote: string;
    quoteAuthor: string;
  }
> = {
  customer: {
    label: "Customer",
    badge: "Join Servyn",
    title: "Create your account",
    subtitle:
      "One account for booking trusted local services, shopping the African market, and — later — selling. Manchester first.",
    redirectTo: "/",
    quote: "The enhanced checks badge gave me the confidence to book childcare.",
    quoteAuthor: "Priya S. · Salford",
  },
  vendor: {
    label: "Service vendor",
    badge: "Join as a Service Vendor",
    title: "Offer your services on Servyn",
    subtitle:
      "Create one Servyn account to list your services, manage availability, and receive protected payouts (2FA required).",
    redirectTo: "/mfa-required?redirect_url=/onboarding/vendor",
    quote: "Protected payments mean I get paid when the job's done — no more chasing.",
    quoteAuthor: "Amara N. · Vendor",
  },
  seller: {
    label: "Product seller",
    badge: "Join as a Product Seller",
    title: "Sell African products on Servyn",
    subtitle:
      "Create one Servyn account to open your storefront, offer retail & bulk pricing, and manage UK orders (2FA required).",
    redirectTo: "/mfa-required?redirect_url=/onboarding/seller",
    quote: "Buyers finally find our pantry staples and wholesale options in one place.",
    quoteAuthor: "Tunde A. · Seller",
  },
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string }>;
}) {
  const params = await searchParams;
  const intent: SignUpIntent =
    params.intent === "vendor" || params.intent === "seller" ? params.intent : "customer";
  const meta = INTENT_META[intent];

  return (
    <AuthShell
      badge={meta.badge}
      badgeTone="gold"
      title={meta.title}
      subtitle={meta.subtitle}
      quote={meta.quote}
      quoteAuthor={meta.quoteAuthor}
    >
      <div
        role="navigation"
        aria-label="Choose account type"
        className="mb-5 grid grid-cols-3 gap-1 rounded-full border border-line bg-surface-2 p-1"
      >
        {(["customer", "vendor", "seller"] as const).map((key) => {
          const isActive = intent === key;
          return (
            <Link
              key={key}
              href={`/sign-up?intent=${key}`}
              className={`rounded-full px-2.5 py-1.5 text-center text-xs font-semibold transition-colors ${
                isActive ? "bg-leaf-800 text-cream shadow-soft" : "text-ink-2 hover:text-leaf-700"
              }`}
            >
              {INTENT_META[key].label}
            </Link>
          );
        })}
      </div>

      <CustomSignUpForm redirectTo={meta.redirectTo} />

      <p className="mt-4 text-center text-[11px] leading-relaxed text-mut">
        One Servyn account works across customer, vendor, and seller roles. By creating an account
        you confirm you are 18+ and agree to our Terms &amp; Privacy Policy.
      </p>
    </AuthShell>
  );
}
