"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  MapPin,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import {
  formatMinorGBP,
  startOrGetConversation,
  useDemoFlow,
} from "@/lib/demo-flow-store";
import { SERVICE_PROVIDERS } from "@/lib/mock-services";

const EXAMPLE_PROMPTS = [
  "Knotless braids under £80 in Hulme, Saturday morning",
  "Fade and beard trim under £30 in Salford",
  "Jollof & small chops catering for 40 guests",
  "Makeup artist for birthday party in Moss Side",
] as const;

const AREA_KEYWORDS = [
  "hulme",
  "salford",
  "cheetham hill",
  "levenshulme",
  "moss side",
  "ardwick",
  "chorlton",
  "trafford",
  "gorton",
  "oldham",
  "manchester",
] as const;

interface MatchCandidate {
  id: string;
  slug: string;
  providerName: string;
  categoryLabel: string;
  area: string;
  tagline: string;
  startingPriceMinor: number;
  rating: number;
  reviews: number;
  verified: boolean;
  nextSlot: string;
  searchableText: string;
  isCustom?: boolean;
}

interface ScoredMatch {
  candidate: MatchCandidate;
  score: number;
  reasons: string[];
}

function parseBudgetMinor(query: string): number | null {
  const match = query.match(/(?:under|below|max|budget|£)\s*£?\s*(\d{1,4})/i);
  if (!match?.[1]) return null;
  const pounds = Number.parseInt(match[1], 10);
  return Number.isFinite(pounds) && pounds > 0 ? pounds * 100 : null;
}

export function AiMatchClient() {
  const router = useRouter();
  const { customServices } = useDemoFlow();
  const [query, setQuery] = React.useState("");
  const [submittedQuery, setSubmittedQuery] = React.useState("");

  const candidates = React.useMemo<MatchCandidate[]>(() => {
    const customMapped: MatchCandidate[] = customServices.map((svc) => ({
      id: svc.id,
      slug: svc.slug,
      providerName: svc.providerName,
      categoryLabel: svc.category,
      area: svc.area,
      tagline: svc.title,
      startingPriceMinor: svc.priceMinor,
      rating: 5.0,
      reviews: 1,
      verified: true,
      nextSlot: "Available this week",
      searchableText:
        `${svc.title} ${svc.providerName} ${svc.category} ${svc.area} ${svc.description}`.toLowerCase(),
      isCustom: true,
    }));

    const seedMapped: MatchCandidate[] = SERVICE_PROVIDERS.map((p) => ({
      id: p.id,
      slug: p.id,
      providerName: p.name,
      categoryLabel: p.categoryLabel,
      area: p.area,
      tagline: p.tagline,
      startingPriceMinor: p.startingPrice * 100,
      rating: p.rating,
      reviews: p.reviews,
      verified: p.verified,
      nextSlot: p.nextSlot,
      searchableText: `${p.name} ${p.categoryLabel} ${p.area} ${p.tagline} ${p.keywords.join(" ")} ${p.offerings.map((o) => o.name).join(" ")}`.toLowerCase(),
    }));

    return [...customMapped, ...seedMapped];
  }, [customServices]);

  const results = React.useMemo<ScoredMatch[]>(() => {
    const activeQuery = submittedQuery.trim().toLowerCase();
    if (!activeQuery) return [];

    const budgetMinor = parseBudgetMinor(activeQuery);
    const matchedArea = AREA_KEYWORDS.find((a) => activeQuery.includes(a));
    const tokens = activeQuery
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length >= 3 && !["under", "below", "with", "this", "next", "from", "near"].includes(t));

    const scored: ScoredMatch[] = candidates.map((candidate) => {
      let score = 58;
      const reasons: string[] = [];

      const tokenHits = tokens.filter((t) => candidate.searchableText.includes(t));
      if (tokenHits.length > 0) {
        score += Math.min(26, tokenHits.length * 9);
        reasons.push(`Matches "${tokenHits.slice(0, 2).join(", ")}" in public listing`);
      }

      if (matchedArea && candidate.area.toLowerCase().includes(matchedArea)) {
        score += 12;
        reasons.push(`Based in ${candidate.area}`);
      } else {
        reasons.push(`Serves ${candidate.area}, Manchester`);
      }

      if (budgetMinor !== null) {
        if (candidate.startingPriceMinor <= budgetMinor) {
          score += 10;
          reasons.push(`Within budget (${formatMinorGBP(candidate.startingPriceMinor)})`);
        } else {
          score -= 14;
        }
      }

      if (candidate.verified) {
        score += 4;
        reasons.push(`Verified · ${candidate.rating.toFixed(1)}★ (${candidate.reviews} reviews)`);
      }

      return {
        candidate,
        score: Math.max(45, Math.min(98, score)),
        reasons: reasons.slice(0, 3),
      };
    });

    return scored
      .filter((item) => item.score >= 60)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [candidates, submittedQuery]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSubmittedQuery(query.trim());
  }

  function handlePromptClick(prompt: string) {
    setQuery(prompt);
    setSubmittedQuery(prompt);
  }

  function handleStartChat(candidate: MatchCandidate) {
    const conv = startOrGetConversation({
      kind: "service",
      providerName: candidate.providerName,
      providerSlug: candidate.slug,
      listingTitle: candidate.tagline,
      area: candidate.area,
      initialMessage: submittedQuery
        ? `Hi ${candidate.providerName}! AI Match recommended you for: "${submittedQuery}". Could we agree a date, location, and price?`
        : `Hi ${candidate.providerName}! Could we agree a date and price for ${candidate.tagline}?`,
    });
    router.push(`/messages?thread=${encodeURIComponent(conv.id)}`);
  }

  return (
    <div className="bg-cream text-ink">
      {/* Leaf-900 Hero */}
      <section className="bg-leaf-900 px-6 py-14 text-cream lg:px-8">
        <div className="mx-auto max-w-[760px] text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-400/35 bg-gold-400/15 px-3.5 py-1 text-[11px] font-bold tracking-[0.08em] uppercase text-gold-300">
            <Sparkles className="size-3.5" aria-hidden="true" />
            <span>AI-Powered Matching</span>
          </span>
          <h1 className="mt-4 font-serif text-3xl font-medium sm:text-4xl">
            Find your perfect service in plain English
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-cream-75">
            Describe what you need, your Manchester area, and your budget. Servyn AI Match scans
            verified public listings and explains why each provider fits.
          </p>

          <form
            onSubmit={handleSearch}
            className="mt-7 flex flex-col gap-2 rounded-2xl bg-surface p-2 shadow-lift sm:flex-row sm:items-center"
          >
            <div className="flex flex-1 items-center gap-2.5 px-3">
              <Search className="size-4 shrink-0 text-mut" aria-hidden="true" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Knotless braids under £80 in Hulme, Saturday morning..."
                aria-label="Describe the service you need"
                className="w-full bg-transparent py-2 text-sm text-ink placeholder:text-mut focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-linear-to-b from-grad-gold-1 to-grad-gold-2 px-5 py-2.5 text-sm font-semibold text-gold-ink shadow-gold transition-all hover:brightness-105"
            >
              <Sparkles className="size-4" aria-hidden="true" />
              <span>Match Me</span>
            </button>
          </form>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {EXAMPLE_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handlePromptClick(prompt)}
                className="cursor-pointer rounded-full border border-cream/20 bg-cream/10 px-3 py-1 text-xs font-medium text-cream-85 transition-colors hover:bg-cream/20 hover:text-cream"
              >
                {prompt}
              </button>
            ))}
          </div>

          <p className="mt-4 text-[11px] text-cream-60">
            Privacy-first grounding: only public listing fields are used — never your personal
            contact or payment details.{" "}
            <Link href="/services" className="underline hover:text-gold-300">
              Prefer classic search?
            </Link>
          </p>
        </div>
      </section>

      {/* Results area */}
      <section className="mx-auto max-w-[960px] px-6 py-10 lg:px-8">
        {!submittedQuery ? (
          <div className="rounded-[18px] border border-line bg-surface p-10 text-center shadow-soft">
            <Sparkles className="mx-auto size-9 text-gold-500" aria-hidden="true" />
            <h2 className="mt-3 font-serif text-xl font-semibold text-ink">
              Describe what you are looking for
            </h2>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-mut">
              Try one of the Manchester prompts above or type your own request to see grounded
              provider matches with transparent pricing.
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="rounded-[18px] border border-line bg-surface p-10 text-center shadow-soft">
            <h2 className="font-serif text-xl font-semibold text-ink">
              No exact matches for &ldquo;{submittedQuery}&rdquo;
            </h2>
            <p className="mt-1.5 text-sm text-mut">
              Try broadening your budget or browse all verified Manchester providers directly.
            </p>
            <Link
              href="/services"
              className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-leaf-800 px-5 py-2.5 text-xs font-semibold text-cream hover:bg-leaf-700"
            >
              <span>Browse all services</span>
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-ink">
                Top {results.length} grounded matches for{" "}
                <span className="font-serif italic text-leaf-700">&ldquo;{submittedQuery}&rdquo;</span>
              </p>
              <Link href="/services" className="text-xs font-semibold text-leaf-700 hover:underline">
                View full directory →
              </Link>
            </div>

            <div className="grid gap-4">
              {results.map(({ candidate, score, reasons }) => (
                <article
                  key={candidate.id}
                  className="rounded-[18px] border border-line bg-surface p-5 shadow-soft transition-colors hover:border-gold-300"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-leaf-900 px-2.5 py-0.5 text-[11px] font-bold text-gold-300">
                          {score}% match
                        </span>
                        <span className="rounded-full bg-mint px-2.5 py-0.5 text-[11px] font-bold text-mint-d">
                          {candidate.categoryLabel}
                        </span>
                        {candidate.isCustom ? (
                          <span className="rounded-full bg-gold-100 px-2.5 py-0.5 text-[11px] font-bold text-butter-d">
                            Newly listed
                          </span>
                        ) : null}
                      </div>
                      <h2 className="mt-2 font-serif text-xl font-semibold text-ink">
                        {candidate.providerName}
                      </h2>
                      <p className="text-sm text-ink-2">{candidate.tagline}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-mut">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3.5 text-leaf-700" aria-hidden="true" />
                          {candidate.area}
                        </span>
                        <span className="inline-flex items-center gap-1 font-semibold text-ink">
                          <Star className="size-3.5 fill-gold-500 text-gold-500" aria-hidden="true" />
                          {candidate.rating.toFixed(1)} ({candidate.reviews})
                        </span>
                        <span>Next: {candidate.nextSlot}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-mut">
                        From
                      </p>
                      <p className="font-serif text-2xl font-semibold tabular-nums text-leaf-900">
                        {formatMinorGBP(candidate.startingPriceMinor)}
                      </p>
                      <p className="text-[11px] text-mut">+10% protected fee</p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-lg border border-line bg-surface-2 px-3.5 py-2.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-mut">
                      Why this match
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {reasons.map((reason) => (
                        <span
                          key={reason}
                          className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-0.5 text-xs text-ink-2"
                        >
                          <ShieldCheck className="size-3 text-leaf-700" aria-hidden="true" />
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleStartChat(candidate)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-line-2 bg-surface-2 px-4 py-2 text-xs font-semibold text-ink transition-colors hover:border-gold-400"
                    >
                      <MessageSquare className="size-3.5" aria-hidden="true" />
                      <span>Chat to agree price/date</span>
                    </button>
                    {!candidate.isCustom ? (
                      <Link
                        href={`/services/${candidate.slug}`}
                        className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-b from-grad-gold-1 to-grad-gold-2 px-4 py-2 text-xs font-semibold text-gold-ink shadow-gold hover:brightness-105"
                      >
                        <span>View profile &amp; book</span>
                        <ArrowRight className="size-3.5" aria-hidden="true" />
                      </Link>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
