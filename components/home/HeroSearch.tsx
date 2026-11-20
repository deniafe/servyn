"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type SearchMode = "auto" | "ai" | "keyword";

const SEARCH_MODES: ReadonlyArray<{ id: SearchMode; label: string }> = [
  { id: "auto", label: "Auto" },
  { id: "ai", label: "AI Match" },
  { id: "keyword", label: "Keyword" },
];

const MODE_LABELS: Record<SearchMode, string> = {
  auto: "Auto",
  ai: "AI Match",
  keyword: "Keyword",
};

const POPULAR_SEARCHES = [
  "Knotless braids",
  "Jollof catering",
  "Childcare in Salford",
  "Home cleaning",
] as const;

export function HeroSearch() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [query, setQuery] = React.useState("");
  const [mode, setMode] = React.useState<SearchMode>("auto");
  const [isFocused, setIsFocused] = React.useState(false);
  const [pending, setPending] = React.useState<{
    query: string;
    mode: SearchMode;
  } | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function runSearch(term: string, searchMode: SearchMode) {
    const params = new URLSearchParams();
    params.set("q", term);
    if (searchMode !== "auto") {
      params.set("mode", searchMode);
    }
    // Zero-latency navigation — show instant status feedback while the services
    // route streams its Suspense skeleton and filtered results.
    setPending({ query: term, mode: searchMode });
    router.push(`/services?${params.toString()}`);
  }

  function handleSuggestionClick(suggestion: string) {
    setQuery(suggestion);
    runSearch(suggestion, mode);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }
    runSearch(trimmed, mode);
  }

  return (
    <div className="flex w-full flex-col items-start">
      <form
        onSubmit={handleSubmit}
        role="search"
        onFocus={() => setIsFocused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsFocused(false);
          }
        }}
        className={cn(
          "flex w-full max-w-[600px] flex-wrap items-center gap-2 rounded-[16px] border border-cream/10 bg-surface p-2 transition-[box-shadow,ring-color] duration-200 ease-standard min-[640px]:flex-nowrap",
          isFocused
            ? "shadow-[0_18px_44px_rgba(7,30,22,0.38)] ring-2 ring-gold-500/45"
            : "shadow-[0_12px_32px_rgba(7,30,22,0.28)]",
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 pl-2 max-[639px]:basis-full">
          <Search
            aria-hidden="true"
            strokeWidth={1.5}
            className="size-4 shrink-0 text-mut"
          />

          <input
            ref={inputRef}
            id="hero-q"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Knotless braids, jollof, Hulme"
            aria-label="Describe the service you need"
            className="min-w-0 flex-1 border-0 bg-transparent py-2 pr-1 text-[15px] font-normal text-ink placeholder:text-placeholder focus:outline-none"
          />

          <AnimatePresence>
            {query.length > 0 && (
              <motion.button
                type="button"
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", bounce: 0, duration: 0.2 }}
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                aria-label="Clear search query"
                className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full bg-surface-2 text-mut transition-colors hover:bg-line hover:text-ink"
              >
                <X className="size-3.5" strokeWidth={2} aria-hidden="true" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <div
          role="radiogroup"
          aria-label="Search mode"
          className="relative inline-flex shrink-0 items-center rounded-[10px] bg-surface-2 p-1"
        >
          {SEARCH_MODES.map((option) => {
            const active = mode === option.id;
            return (
              <motion.button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={active}
                whileTap={{ scale: 0.97 }}
                onClick={() => setMode(option.id)}
                className={cn(
                  "relative z-[1] h-8 cursor-pointer rounded-[7px] px-2.5 text-[12px] font-medium whitespace-nowrap transition-colors duration-150 ease-standard",
                  active ? "text-ink" : "text-mut hover:text-ink-2",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="hero-search-mode-pill"
                    transition={{ type: "spring", bounce: 0, duration: 0.32 }}
                    className="absolute inset-0 -z-[1] rounded-[7px] bg-surface shadow-[0_1px_3px_rgba(13,49,35,0.12)] ring-1 ring-line"
                  />
                )}
                {option.label}
              </motion.button>
            );
          })}
        </div>

        <motion.button
          type="submit"
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", bounce: 0, duration: 0.16 }}
          className="h-10 cursor-pointer rounded-[8px] bg-gold-500 px-4 text-[14px] font-medium whitespace-nowrap text-gold-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] transition-colors duration-150 ease-standard hover:bg-gold-400 min-[640px]:px-5 max-[639px]:flex-1"
        >
          Search
        </motion.button>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-cream-60">
        <span>Popular:</span>
        {POPULAR_SEARCHES.map((suggestion) => {
          const isSelected = query === suggestion;
          return (
            <motion.button
              key={suggestion}
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => handleSuggestionClick(suggestion)}
              className={cn(
                "cursor-pointer underline-offset-4 transition-colors duration-150 ease-standard hover:text-cream hover:underline",
                isSelected && "text-cream underline",
              )}
            >
              {suggestion}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {pending && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: -6, scale: 0.97 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: -6, scale: 0.97 }
            }
            transition={
              shouldReduceMotion
                ? { duration: 0.18 }
                : { type: "spring", bounce: 0, duration: 0.28 }
            }
            className="mt-3 inline-flex origin-top-left items-center gap-2 rounded-[8px] border border-cream/10 bg-leaf-950/80 px-3 py-1.5 text-[12px] text-cream-75"
          >
            <motion.span
              aria-hidden="true"
              className="inline-block size-1.5 rounded-full bg-gold-400"
              animate={
                shouldReduceMotion ? undefined : { opacity: [0.3, 1, 0.3] }
              }
              transition={
                shouldReduceMotion
                  ? undefined
                  : { duration: 1, repeat: Infinity, ease: "easeInOut" }
              }
            />
            <span>
              Searching{" "}
              <strong className="font-medium text-cream">
                {pending.query}
              </strong>{" "}
              ({MODE_LABELS[pending.mode]})
            </span>
            <button
              type="button"
              onClick={() => setPending(null)}
              aria-label="Dismiss search preview"
              className="inline-flex size-4 cursor-pointer items-center justify-center rounded text-cream-60 transition-colors duration-150 ease-standard hover:text-cream"
            >
              <X className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
