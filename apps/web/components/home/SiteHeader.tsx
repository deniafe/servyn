"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  MapPin,
  Menu,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import {
  BROWSE_MARKET_PLACES,
  BROWSE_SERVICES,
  BrowseMenu,
} from "@/components/home/BrowseMenu";
import { useCart } from "@/components/home/CartProvider";
import { HeaderAuthSlot } from "@/components/auth/HeaderAuthSlot";
import { NotificationsMenu } from "@/components/home/NotificationsMenu";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";

const MANCHESTER_AREAS = [
  "Hulme",
  "Salford",
  "Cheetham Hill",
  "Levenshulme",
  "Moss Side",
  "Ardwick",
  "Gorton",
  "Chorlton",
  "Trafford",
  "Oldham",
] as const;

const NAV_ITEMS: ReadonlyArray<{
  label: string;
  href: string;
  badge: number | null;
}> = [
  { label: "Services", href: "/services", badge: null },
  { label: "Market", href: "/market", badge: null },
  { label: "Community", href: "/community", badge: null },
  { label: "Bookings", href: "/dashboard", badge: null },
  { label: "Messages", href: "/messages", badge: null },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const { cartCount, openCart } = useCart();
  const [area, setArea] = React.useState<string>("Hulme");
  const [areaOpen, setAreaOpen] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [mobileBrowseOpen, setMobileBrowseOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [searchActive, setSearchActive] = React.useState(false);
  const searchTimerRef = React.useRef<number | undefined>(undefined);

  React.useEffect(() => {
    return () => window.clearTimeout(searchTimerRef.current);
  }, []);

  React.useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleSearchClick() {
    setMobileOpen(false);
    if (pathname === "/services") {
      focusHeroSearch();
      return;
    }
    setSearchActive(true);
    window.clearTimeout(searchTimerRef.current);
    // Let the icon pulse play for a beat, then glide to the services page.
    searchTimerRef.current = window.setTimeout(
      () => router.push("/services"),
      shouldReduceMotion ? 0 : 200,
    );
  }

  function focusHeroSearch() {
    setMobileOpen(false);
    const el =
      document.getElementById("services-search") ??
      document.getElementById("market-search") ??
      document.getElementById("hero-q");
    if (el instanceof HTMLInputElement) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.focus();
    }
  }

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-[100] text-cream transition-[background-color,box-shadow,border-color] duration-300 ease-standard",
          isScrolled
            ? "apple-glass-header border-b border-cream/10 shadow-[0_8px_30px_rgba(7,30,22,0.45)]"
            : "bg-leaf-900"
        )}
      >
        <div
          aria-hidden="true"
          className="h-1.5 w-full"
          style={{ background: "var(--sv-kente)" }}
        />

        <div className="mx-auto flex h-[calc(var(--sv-hdr-h)-6px)] max-w-[1240px] items-center gap-[18px] px-6 max-[720px]:gap-2.5 max-[720px]:px-4">
          <Link
            href="/"
            aria-label="Servyn home"
            className="group flex items-baseline font-serif text-[27px] leading-none font-[650] tracking-[-0.01em] text-cream max-[720px]:text-[23px]"
          >
            Serv
            <em className="not-italic text-gold-400 transition-[text-shadow] duration-200 group-hover:[text-shadow:0_0_18px_rgba(242,184,75,0.7)]">
              yn
            </em>
          </Link>

          <Popover open={areaOpen} onOpenChange={setAreaOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Change location"
                className="hidden cursor-pointer items-center gap-[7px] rounded-full border border-gold-45 px-[13px] py-[7px] text-[11px] font-bold tracking-[0.12em] uppercase text-gold-300 transition-colors hover:bg-gold-15 min-[921px]:inline-flex"
              >
                <MapPin className="size-[13px] shrink-0" aria-hidden="true" />
                <span>{area.toUpperCase()}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="z-[110] w-64 p-3">
              <PopoverHeader className="mb-2">
                <PopoverTitle className="font-serif text-sm font-semibold text-ink">
                  Manchester areas
                </PopoverTitle>
              </PopoverHeader>
              <div className="flex flex-wrap gap-1.5">
                {MANCHESTER_AREAS.map((candidate) => (
                  <button
                    key={candidate}
                    type="button"
                    onClick={() => {
                      setArea(candidate);
                      setAreaOpen(false);
                    }}
                    className={cn(
                      "cursor-pointer rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
                      area === candidate
                        ? "border-leaf-800 bg-leaf-800 text-cream"
                        : "border-line-2 bg-surface-2 text-ink-2 hover:border-gold-500"
                    )}
                  >
                    {candidate}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <nav
            aria-label="Primary"
            className="ml-2 hidden items-center gap-1 min-[921px]:flex"
          >
            <BrowseMenu
              isActive={pathname === "/"}
              onSelectAiMatch={focusHeroSearch}
            />
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href !== "/#how-it-works" &&
                item.href !== "/#for-providers" &&
                pathname.startsWith(item.href);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "relative inline-flex items-center gap-1.5 rounded-[8px] px-[13px] py-2 text-[14.5px] font-semibold transition-colors",
                    isActive
                      ? "text-gold-400 after:absolute after:inset-x-[13px] after:bottom-[2px] after:h-[2px] after:rounded-[2px] after:bg-gold-400"
                      : "text-cream-75 hover:text-cream"
                  )}
                >
                  <span>{item.label}</span>
                  {item.badge !== null && (
                    <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-[8px] bg-red px-1 text-[10px] font-extrabold text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2.5">
            <motion.button
              type="button"
              whileTap={{ scale: 0.88 }}
              onClick={handleSearchClick}
              aria-label="Search services"
              className="relative inline-flex size-10 cursor-pointer items-center justify-center rounded-[12px] text-cream-85 transition-colors hover:bg-white/[0.08] hover:text-gold-300"
            >
              <AnimatePresence>
                {searchActive && !shouldReduceMotion && (
                  <motion.span
                    aria-hidden="true"
                    initial={{ opacity: 0.55, scale: 0.6 }}
                    animate={{ opacity: 0, scale: 1.7 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="pointer-events-none absolute inset-0 rounded-full bg-gold-400/40"
                  />
                )}
              </AnimatePresence>
              <motion.span
                animate={
                  searchActive && !shouldReduceMotion
                    ? { scale: [1, 1.28, 1.12], rotate: [0, -14, 0], color: "#f2b84b" }
                    : { scale: 1, rotate: 0 }
                }
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="inline-flex"
              >
                <Search className="size-5" aria-hidden="true" />
              </motion.span>
            </motion.button>

            <NotificationsMenu />

            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={openCart}
              aria-label={`Open basket (${cartCount} items)`}
              className="relative inline-flex size-10 cursor-pointer items-center justify-center rounded-[12px] text-cream-85 transition-colors hover:bg-white/[0.08] hover:text-gold-300"
            >
              <ShoppingCart className="size-5" aria-hidden="true" />
              <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-[8px] border-2 border-leaf-900 bg-red px-1 text-[10px] font-extrabold text-white tabular-nums">
                {cartCount}
              </span>
            </motion.button>

            <React.Suspense fallback={<div className="h-9 w-24 rounded-full bg-cream/10" />}>
              <HeaderAuthSlot />
            </React.Suspense>

            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              aria-label={mobileOpen ? "Close menu" : "Menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((prev) => !prev)}
              className="inline-flex size-10 cursor-pointer items-center justify-center rounded-[12px] text-cream-85 transition-colors hover:bg-white/[0.08] hover:text-gold-300 min-[921px]:hidden"
            >
              {mobileOpen ? (
                <X className="size-5" aria-hidden="true" />
              ) : (
                <Menu className="size-5" aria-hidden="true" />
              )}
            </motion.button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            aria-label="Mobile menu"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={
              shouldReduceMotion
                ? { duration: 0.18 }
                : { type: "spring", bounce: 0, duration: 0.28 }
            }
            className="apple-glass-header fixed inset-x-0 top-[var(--sv-hdr-h)] z-[99] flex flex-col gap-1 border-t border-cream-line px-5 pt-3.5 pb-5 text-cream shadow-[0_24px_40px_rgba(7,30,22,0.5)] min-[921px]:hidden"
          >
            <button
              type="button"
              aria-expanded={mobileBrowseOpen}
              onClick={() => setMobileBrowseOpen((prev) => !prev)}
              className="flex cursor-pointer items-center justify-between rounded-[10px] bg-gold-15 px-2.5 py-3 text-base font-semibold text-gold-400"
            >
              <span>Browse</span>
              <ChevronDown
                className={cn(
                  "size-4 transition-transform duration-200",
                  mobileBrowseOpen && "rotate-180",
                )}
                strokeWidth={2}
                aria-hidden="true"
              />
            </button>
            {mobileBrowseOpen && (
              <div className="mb-1 max-h-[45vh] overflow-y-auto rounded-[12px] bg-surface p-3 text-ink">
                <p className="px-2 pb-1.5 text-[11px] font-bold tracking-[0.09em] uppercase text-mut">
                  Services
                </p>
                <ul className="flex flex-col gap-0.5">
                  {BROWSE_SERVICES.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          onClick={() => {
                            setMobileBrowseOpen(false);
                            setMobileOpen(false);
                          }}
                          className="flex items-center gap-2.5 rounded-[8px] px-2 py-2 text-[14px] font-medium text-ink hover:bg-surface-2"
                        >
                          <Icon
                            className="size-4 shrink-0 text-leaf-600"
                            strokeWidth={1.75}
                            aria-hidden="true"
                          />
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                <p className="px-2 pt-3 pb-1.5 text-[11px] font-bold tracking-[0.09em] uppercase text-mut">
                  Market &amp; Places
                </p>
                <ul className="flex flex-col gap-0.5">
                  {BROWSE_MARKET_PLACES.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          onClick={() => {
                            setMobileBrowseOpen(false);
                            setMobileOpen(false);
                          }}
                          className="flex items-center gap-2.5 rounded-[8px] px-2 py-2 text-[14px] font-medium text-ink hover:bg-surface-2"
                        >
                          <Icon
                            className="size-4 shrink-0 text-leaf-600"
                            strokeWidth={1.75}
                            aria-hidden="true"
                          />
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href !== "/#how-it-works" &&
                item.href !== "/#for-providers" &&
                pathname.startsWith(item.href);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-[10px] px-2.5 py-3 text-base font-semibold",
                    isActive
                      ? "bg-gold-15 text-gold-400"
                      : "text-cream-85 hover:bg-white/[0.06]"
                  )}
                >
                  <span>{item.label}</span>
                  {item.badge !== null && (
                    <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-[8px] bg-red px-1 text-[10px] font-extrabold text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
            <div className="mt-2.5 flex justify-center border-t border-cream-line pt-3">
              <React.Suspense fallback={<div className="h-9 w-28 rounded-full bg-cream/10" />}>
                <HeaderAuthSlot />
              </React.Suspense>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
