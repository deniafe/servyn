import { CircleCheck, MapPin, ShieldCheck } from "lucide-react";
import { AfricanMarketSection } from "@/components/home/AfricanMarketSection";
import { CategorySection } from "@/components/home/CategorySection";
import { CommunityFavouritesSection } from "@/components/home/CommunityFavouritesSection";
import { CookieNotice } from "@/components/home/CookieNotice";
import { ForProvidersSection } from "@/components/home/ForProvidersSection";
import { HeroRevealItem } from "@/components/home/HeroReveal";
import { HeroSearch } from "@/components/home/HeroSearch";
import { HeroStudioStage } from "@/components/home/HeroStudioStage";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { ProtectedPaymentSection } from "@/components/home/ProtectedPaymentSection";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteHeader } from "@/components/home/SiteHeader";

export default function Home() {
  return (
    <div id="top" className="flex min-h-screen flex-col bg-cream text-ink">
      <SiteHeader />

          <main className="flex flex-1 flex-col pt-[var(--sv-hdr-h)]">
            <section
              aria-label="Welcome"
              className="hero-surface relative flex min-h-[calc(100svh-var(--sv-hdr-h))] items-center text-cream"
            >
            <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 items-center gap-10 px-6 pt-8 pb-36 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12 lg:px-8 lg:py-10">
              <div className="flex flex-col items-start">
                <HeroRevealItem delay={0.02} y={10}>
                  <p className="mb-4 text-[13px] font-normal text-cream-60">
                    Greater Manchester
                  </p>
                </HeroRevealItem>

                <HeroRevealItem delay={0.06} y={16} blur>
                  <h1 className="mb-5 max-w-[18ch] font-serif [font-optical-sizing:auto] [font-variation-settings:'WONK'_0] text-[clamp(2.25rem,4.4vw,3.75rem)] leading-[1.06] font-medium tracking-[-0.025em] text-cream">
                    Book trusted{" "}
                    <span className="whitespace-nowrap">Afro-Caribbean</span>{" "}
                    services across Manchester
                  </h1>
                </HeroRevealItem>

                <HeroRevealItem delay={0.12} y={14}>
                  <p className="mb-8 max-w-[48ch] text-[16px] leading-[1.6] font-normal text-cream-75">
                    Hair, barbering, catering, childcare, tailoring and home
                    services from verified local providers — plus an African
                    market for pantry staples, fabrics and craft.
                  </p>
                </HeroRevealItem>

                <HeroRevealItem
                  delay={0.18}
                  y={14}
                  scale={0.985}
                  className="w-full"
                >
                  <HeroSearch />
                </HeroRevealItem>

                <HeroRevealItem delay={0.24} y={12}>
                  <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] font-normal text-cream-60">
                    <span className="inline-flex items-center gap-2">
                      <ShieldCheck
                        className="size-4 shrink-0 text-cream-60"
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                      Protected payments until completion
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <CircleCheck
                        className="size-4 shrink-0 text-cream-60"
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                      ID-verified providers
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <MapPin
                        className="size-4 shrink-0 text-cream-60"
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                      <span>
                        <span className="tabular-nums">10</span> Manchester areas
                      </span>
                    </span>
                  </div>
                </HeroRevealItem>
              </div>

              <div className="mx-auto w-full max-w-[420px] lg:mx-0 lg:ml-auto xl:max-w-[440px]">
                <HeroRevealItem delay={0.12} y={18} scale={0.97}>
                  <HeroStudioStage />
                </HeroRevealItem>
              </div>
            </div>
            </section>

            <CategorySection />
            <CommunityFavouritesSection />
            <AfricanMarketSection />
            <ProtectedPaymentSection />
            <HowItWorksSection />
            <ForProvidersSection />
          </main>

        <SiteFooter />
        <CookieNotice />
      </div>
  );
}
