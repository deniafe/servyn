import Link from "next/link";
import { ArrowUp } from "lucide-react";
import { CookiePreferencesTrigger } from "@/components/home/CookiePreferencesTrigger";

interface FooterColumn {
  heading: string;
  links: ReadonlyArray<{ label: string; href: string }>;
}

const FOOTER_COLUMNS: ReadonlyArray<FooterColumn> = [
  {
    heading: "Marketplace",
    links: [
      { label: "Hair & Beauty", href: "/services?category=hair-beauty" },
      { label: "Barbering & Grooming", href: "/services?category=barbering-grooming" },
      { label: "Childcare & Family", href: "/services?category=childcare-family" },
      { label: "Catering & Food", href: "/services?category=catering-food" },
      { label: "AI Service Match", href: "/ai-match" },
      { label: "African Market", href: "/market" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Our promise", href: "/#how-it-works" },
      { label: "Community", href: "/community" },
      { label: "Vendor pricing", href: "/pricing" },
      { label: "Become a vendor", href: "/sign-up?intent=vendor" },
      { label: "Sell on the market", href: "/market?mode=bulk" },
    ],
  },
  {
    heading: "Support & Policies",
    links: [
      { label: "Contact us", href: "/contact" },
      { label: "Cancellation & refunds", href: "/refunds" },
      { label: "Protected payments", href: "/#protected-payments" },
      { label: "Terms & conditions", href: "/terms" },
      { label: "Privacy & your data", href: "/privacy" },
      { label: "Cookie policy", href: "/cookies" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-leaf-950 text-cream">
      <div
        aria-hidden="true"
        className="h-1.5 w-full"
        style={{ background: "var(--sv-kente)" }}
      />

      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <Link
            href="#top"
            className="inline-flex items-baseline font-serif text-[26px] leading-none font-[650] tracking-[-0.01em] text-cream"
          >
            Serv<em className="not-italic text-gold-400">yn</em>
          </Link>
          <p className="mt-3 font-serif text-[14px] italic text-gold-400">
            &ldquo;For the community, by the community.&rdquo;
          </p>
          <p className="mt-3 max-w-[30ch] text-[13px] leading-[1.6] text-cream-60">
            One marketplace. Many services. More ways to grow. Manchester first
            — Birmingham and London next.
          </p>
        </div>

        {FOOTER_COLUMNS.map((column) => (
          <div key={column.heading}>
            <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-cream">
              {column.heading}
            </p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {column.links.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-[13.5px] text-cream-60 transition-colors hover:text-cream"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              {column.heading === "Support & Policies" ? (
                <li>
                  <CookiePreferencesTrigger />
                </li>
              ) : null}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-cream-line">
        <div className="mx-auto flex w-full max-w-[1240px] flex-wrap items-center justify-between gap-4 px-6 py-5 text-[12px] text-cream-60 lg:px-8">
          <p>
            © 2026 SERVYN LTD (Company No. 17603157, registered in England &amp; Wales) · 5, Queens Chambers, John Dalton Street, Manchester, M2 6ET · Payments powered by Stripe
          </p>
          <div
            aria-hidden="true"
            className="hidden h-1.5 w-24 rounded-full sm:block"
            style={{ background: "var(--sv-kente)" }}
          />
          <Link
            href="#top"
            className="inline-flex items-center gap-1.5 font-semibold text-gold-400 transition-colors hover:text-gold-300"
          >
            <span>Back to top</span>
            <ArrowUp
              className="size-3.5"
              strokeWidth={2}
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </footer>
  );
}
