"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Heart,
  MapPin,
  MessageSquare,
  RotateCcw,
  ShieldCheck,
  Star,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  APPLE_SPRING_SNAPPY,
  HeartPulse,
  useRevealMotion,
} from "@/components/ui/motion";
import type { ServiceProvider } from "@/lib/data/services";
import { cn } from "@/lib/utils";

const STARS = [0, 1, 2, 3, 4] as const;

function formatGBP(amount: number): string {
  return `£${amount.toFixed(2)}`;
}

export function ServiceProviderDetail({
  provider,
}: {
  provider: ServiceProvider;
}) {
  const reduce = useReducedMotion();
  const headerReveal = useRevealMotion();
  const defaultDayId =
    provider.availability.find((day) => day.freeCount > 0)?.id ??
    provider.availability[0]?.id ??
    "";

  const [isSaved, setIsSaved] = React.useState<boolean>(
    Boolean(provider.defaultSaved),
  );
  const [selectedOfferingId, setSelectedOfferingId] = React.useState<
    string | null
  >(null);
  const [selectedDayId, setSelectedDayId] = React.useState<string>(defaultDayId);
  const [selectedTime, setSelectedTime] = React.useState<string | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = React.useState(false);
  const [bookingHint, setBookingHint] = React.useState<string | null>(null);

  const [messageOpen, setMessageOpen] = React.useState(false);
  const [messageText, setMessageText] = React.useState("");
  const [messageSent, setMessageSent] = React.useState(false);

  const selectedOffering =
    provider.offerings.find((item) => item.id === selectedOfferingId) ?? null;
  const activeDay =
    provider.availability.find((day) => day.id === selectedDayId) ??
    provider.availability[0];

  const bookingFee = selectedOffering
    ? Math.round(selectedOffering.price * 0.1 * 100) / 100
    : 0;
  const totalAmount = selectedOffering
    ? selectedOffering.price + bookingFee
    : 0;

  const maxBreakdownCount = Math.max(
    1,
    ...provider.ratingBreakdown.map((item) => item.count),
  );

  function scrollToSection(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function handleSelectDay(dayId: string) {
    setSelectedDayId(dayId);
    setSelectedTime(null);
    setBookingConfirmed(false);
    setBookingHint(null);
  }

  function handleBookAndPay() {
    if (!selectedOffering) {
      setBookingHint("First choose a service from the list on the left.");
      scrollToSection("services-menu");
      return;
    }
    if (!selectedTime) {
      setBookingHint("Now pick an available day and time slot.");
      scrollToSection("availability");
      return;
    }
    setBookingHint(null);
    setBookingConfirmed(true);
  }

  function handleSendMessage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!messageText.trim()) return;
    setMessageSent(true);
    setMessageText("");
  }

  return (
    <div className="mx-auto w-full max-w-[1240px] px-6 py-7 lg:px-8 lg:py-9">
      {/* Breadcrumb back link */}
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-2 text-[13px] text-mut"
      >
        <Link
          href="/services"
          className="inline-flex items-center gap-1.5 font-semibold text-leaf-700 transition-colors hover:text-leaf-900"
        >
          <ArrowLeft className="size-4" strokeWidth={1.85} aria-hidden="true" />
          <span>All Manchester services</span>
        </Link>
        <span aria-hidden="true">/</span>
        <span>{provider.categoryLabel}</span>
      </nav>

      {/* Top Provider Summary Card */}
      <motion.section
        {...headerReveal}
        aria-label="Provider summary"
        className="mt-4 overflow-hidden rounded-[22px] border border-line bg-surface shadow-soft"
      >
        <div
          aria-hidden="true"
          className="h-[3px] w-full"
          style={{ background: "var(--sv-kente)" }}
        />

        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
            <div
              className={cn(
                "flex size-16 shrink-0 items-center justify-center rounded-[16px] font-serif text-[22px] font-bold text-cream shadow-sm",
                provider.avatarColorClass,
              )}
            >
              {provider.initials}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-serif text-[clamp(1.6rem,2.7vw,2.1rem)] leading-tight font-semibold tracking-[-0.02em] text-ink">
                  {provider.name}
                </h1>

                {provider.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-gold-200 bg-gold-100 px-2.5 py-0.5 text-[11.5px] font-bold text-gold-ink">
                    <ShieldCheck
                      className="size-3.5 text-gold-600"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    <span>Verified</span>
                  </span>
                )}

                {provider.enhancedChecks && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-leaf-200 bg-leaf-50 px-2.5 py-0.5 text-[11.5px] font-semibold text-leaf-800">
                    <ShieldCheck
                      className="size-3.5 text-leaf-600"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    <span>Enhanced DBS</span>
                  </span>
                )}
              </div>

              <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13.5px] text-mut">
                <span>{provider.categoryLabel}</span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 text-ink-2">
                  <MapPin
                    className="size-3.5 text-leaf-600"
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                  <span>{provider.area}, Manchester</span>
                </span>
                <span aria-hidden="true">·</span>
                <span>{provider.joinedLabel}</span>
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-2 tabular-nums">
                <span className="inline-flex items-center gap-1">
                  <Star
                    className="size-3.5 fill-gold-500 text-gold-500"
                    aria-hidden="true"
                  />
                  <span className="font-bold text-ink">
                    {provider.rating.toFixed(1)}
                  </span>
                  <span className="text-mut">({provider.reviews})</span>
                </span>

                <span className="inline-flex items-center gap-1.5 text-mut">
                  <CheckCircle2
                    className="size-3.5 text-leaf-600"
                    strokeWidth={1.85}
                    aria-hidden="true"
                  />
                  <span>
                    <strong className="font-semibold text-ink">
                      {provider.completedBookings}
                    </strong>{" "}
                    bookings completed
                  </span>
                </span>

                <span className="inline-flex items-center gap-1.5 text-mut">
                  <Clock
                    className="size-3.5 text-leaf-600"
                    strokeWidth={1.85}
                    aria-hidden="true"
                  />
                  <span>{provider.responseTime}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2.5 self-start sm:self-center">
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              aria-pressed={isSaved}
              aria-label={
                isSaved
                  ? `Remove ${provider.name} from saved`
                  : `Save ${provider.name}`
              }
              onClick={() => setIsSaved((prev) => !prev)}
              className={cn(
                "flex size-10 cursor-pointer items-center justify-center rounded-full border transition-colors",
                isSaved
                  ? "border-red/25 bg-blush/35 text-red"
                  : "border-line-2 bg-surface text-mut hover:border-leaf-700 hover:text-red",
              )}
            >
              <HeartPulse active={isSaved}>
                <Heart
                  className={cn("size-4.5", isSaved && "fill-red")}
                  strokeWidth={1.85}
                  aria-hidden="true"
                />
              </HeartPulse>
            </motion.button>

            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              aria-expanded={messageOpen}
              onClick={() => {
                setMessageOpen((prev) => !prev);
                setMessageSent(false);
              }}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line-2 bg-surface px-4 py-2 text-[13.5px] font-semibold text-ink transition-colors hover:border-leaf-700 hover:bg-surface-2"
            >
              <MessageSquare
                className="size-4 text-leaf-700"
                strokeWidth={1.85}
                aria-hidden="true"
              />
              <span>Message</span>
            </motion.button>
          </div>
        </div>

        {/* Inline Message Panel */}
        <AnimatePresence initial={false}>
          {messageOpen && (
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
              transition={APPLE_SPRING_SNAPPY}
              className="overflow-hidden border-t border-line bg-surface-2/80"
            >
              <div className="px-6 py-4">
                {messageSent ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[13.5px]">
                    <p className="inline-flex items-center gap-2 font-medium text-leaf-800">
                      <CheckCircle2
                        className="size-4 text-leaf-600"
                        aria-hidden="true"
                      />
                      <span>
                        Message sent to {provider.name} — usually responds{" "}
                        {provider.responseTime.replace("Replies ", "within ")}.
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setMessageSent(false)}
                      className="cursor-pointer text-[12.5px] font-semibold text-leaf-700 underline underline-offset-4 hover:text-leaf-900"
                    >
                      Send another note
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSendMessage}
                    className="flex flex-col gap-2.5 sm:flex-row sm:items-center"
                  >
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder={`Ask ${provider.name} about availability, dietary options, or custom requests…`}
                      aria-label={`Message ${provider.name}`}
                      className="min-w-0 flex-1 rounded-full border border-line-2 bg-surface px-4 py-2 text-[13.5px] text-ink placeholder:text-mut focus:border-leaf-700 focus:outline-none"
                    />
                    <motion.button
                      type="submit"
                      whileTap={{ scale: 0.96 }}
                      className="shrink-0 cursor-pointer rounded-full bg-leaf-900 px-5 py-2 text-[13px] font-semibold text-cream transition-colors hover:bg-leaf-800"
                    >
                      Send enquiry
                    </motion.button>
                  </form>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* Main 2-Column Content & Sticky Booking Sidebar */}
      <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          {/* About Card */}
          <section
            aria-labelledby="about-heading"
            className="rounded-[20px] border border-line bg-surface p-6 shadow-soft"
          >
            <h2
              id="about-heading"
              className="font-serif text-[20px] font-semibold text-ink"
            >
              About
            </h2>
            <p className="mt-3 max-w-[68ch] text-[14.5px] leading-relaxed text-ink-2">
              {provider.about}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {provider.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-line bg-surface-2 px-3 py-1 text-[12px] font-medium text-ink-2"
                >
                  {tag}
                </span>
              ))}
              <span className="inline-flex items-center gap-1 rounded-full border border-leaf-200 bg-leaf-50 px-3 py-1 text-[12px] font-semibold text-leaf-800">
                <ShieldCheck
                  className="size-3.5 text-leaf-600"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                <span>ID verified</span>
              </span>
              {provider.enhancedChecks && (
                <span className="inline-flex items-center gap-1 rounded-full border border-leaf-200 bg-leaf-50 px-3 py-1 text-[12px] font-semibold text-leaf-800">
                  <ShieldCheck
                    className="size-3.5 text-leaf-600"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  <span>Enhanced DBS &amp; Ofsted</span>
                </span>
              )}
            </div>
          </section>

          {/* Services & Prices Card */}
          <section
            id="services-menu"
            aria-labelledby="services-prices-heading"
            className="scroll-mt-[calc(var(--sv-hdr-h)+20px)] rounded-[20px] border border-line bg-surface p-6 shadow-soft"
          >
            <h2
              id="services-prices-heading"
              className="font-serif text-[20px] font-semibold text-ink"
            >
              Services &amp; prices
            </h2>

            <div className="mt-4 flex flex-col gap-3">
              {provider.offerings.map((offering) => {
                const isSelected = selectedOfferingId === offering.id;
                return (
                  <div
                    key={offering.id}
                    className={cn(
                      "flex flex-col justify-between gap-4 rounded-[16px] border p-4 transition-colors sm:flex-row sm:items-center",
                      isSelected
                        ? "border-leaf-700 bg-gold-50/65 shadow-xs"
                        : "border-line bg-surface hover:border-line-2",
                    )}
                  >
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-semibold text-ink">
                        {offering.name}
                      </h3>
                      <p className="mt-1 text-[13px] leading-snug text-mut">
                        {offering.description}
                      </p>
                      <p className="mt-2 inline-flex items-center gap-1 text-[12px] text-mut">
                        <Clock
                          className="size-3.5 text-leaf-600"
                          strokeWidth={1.75}
                          aria-hidden="true"
                        />
                        <span>{offering.duration}</span>
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end">
                      <span className="font-serif text-[17.5px] font-bold text-ink tabular-nums">
                        {formatGBP(offering.price)}
                      </span>
                      <button
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => {
                          setSelectedOfferingId(offering.id);
                          setBookingConfirmed(false);
                          setBookingHint(null);
                        }}
                        className={cn(
                          "inline-flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-1.5 text-[12.5px] font-semibold transition-colors",
                          isSelected
                            ? "bg-linear-to-b from-grad-gold-1 to-grad-gold-2 font-bold text-gold-ink shadow-xs"
                            : "bg-leaf-900 text-cream hover:bg-leaf-800",
                        )}
                      >
                        {isSelected && (
                          <Check
                            className="size-3.5"
                            strokeWidth={2.25}
                            aria-hidden="true"
                          />
                        )}
                        <span>{isSelected ? "Selected" : "Select"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Availability Card */}
          <section
            id="availability"
            aria-labelledby="availability-heading"
            className="scroll-mt-[calc(var(--sv-hdr-h)+20px)] rounded-[20px] border border-line bg-surface p-6 shadow-soft"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2
                id="availability-heading"
                className="font-serif text-[20px] font-semibold text-ink"
              >
                Availability
              </h2>
              {activeDay && (
                <p className="text-[12.5px] font-medium text-mut">
                  {activeDay.weekday} {activeDay.dayNum} {activeDay.monthLabel}
                </p>
              )}
            </div>

            {/* Horizontal scrollable day strip */}
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2.5">
              {provider.availability.map((day) => {
                const isSelected = activeDay?.id === day.id;
                const isUnavailable = day.freeCount === 0;

                return (
                  <motion.button
                    key={day.id}
                    type="button"
                    disabled={isUnavailable}
                    aria-pressed={isSelected}
                    whileTap={isUnavailable ? undefined : { scale: 0.95 }}
                    onClick={() => handleSelectDay(day.id)}
                    className={cn(
                      "relative z-[1] flex min-w-[66px] shrink-0 flex-col items-center rounded-[14px] border px-2.5 py-2.5 text-center transition-colors",
                      isUnavailable
                        ? "cursor-not-allowed border-line/70 bg-surface-2/60 text-mut/50"
                        : isSelected
                          ? "cursor-pointer border-transparent text-ink"
                          : "cursor-pointer border-line bg-surface text-ink hover:border-leaf-700",
                    )}
                  >
                    {isSelected && (
                      <motion.span
                        layoutId="availability-day-ring"
                        transition={APPLE_SPRING_SNAPPY}
                        className="absolute inset-0 -z-[1] rounded-[14px] border border-gold-500 bg-gold-50 shadow-xs ring-1 ring-gold-400/50"
                      />
                    )}
                    <span className="text-[10.5px] font-bold tracking-[0.06em] uppercase text-mut">
                      {day.weekday}
                    </span>
                    <span className="mt-0.5 font-serif text-[19px] leading-tight font-bold tabular-nums">
                      {day.dayNum}
                    </span>
                    <span
                      className={cn(
                        "mt-0.5 text-[11px] font-medium tabular-nums",
                        isUnavailable ? "text-mut/60" : "text-leaf-700",
                      )}
                    >
                      {day.freeCount === 0 ? "—" : `${day.freeCount} free`}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Subtle scrollbar indicator bar */}
            <div
              aria-hidden="true"
              className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-2"
            >
              <div className="h-full w-3/5 rounded-full bg-leaf-700" />
            </div>

            {/* Time slot selector buttons */}
            {activeDay && (
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeDay.id}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                  className="mt-4 flex flex-wrap gap-2"
                >
                  {activeDay.slots.map((slot) => {
                    const isChosen = selectedTime === slot.time;
                    return (
                      <motion.button
                        key={slot.time}
                        type="button"
                        disabled={!slot.available}
                        aria-pressed={isChosen}
                        whileTap={slot.available ? { scale: 0.94 } : undefined}
                        onClick={() => {
                          setSelectedTime(slot.time);
                          setBookingConfirmed(false);
                          setBookingHint(null);
                        }}
                        className={cn(
                          "min-w-[82px] rounded-[11px] border px-3.5 py-2 text-[13px] font-semibold transition-colors tabular-nums",
                          !slot.available
                            ? "cursor-not-allowed border-line/60 bg-surface-2/60 text-mut/45 line-through"
                            : isChosen
                              ? "cursor-pointer border-leaf-900 bg-leaf-900 text-cream shadow-xs"
                              : "cursor-pointer border-line-2 bg-surface text-ink hover:border-leaf-700 hover:bg-surface-2",
                        )}
                      >
                        {slot.time}
                      </motion.button>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            )}

            <p className="mt-4 flex items-center gap-1.5 text-[12px] text-mut">
              <Clock
                className="size-3.5 text-leaf-600"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <span>Bookings need 24h notice · times shown in your timezone</span>
            </p>
          </section>

          {/* Location & Service Area Placeholder Map Card */}
          <section
            aria-labelledby="location-heading"
            className="rounded-[20px] border border-line bg-surface p-6 shadow-soft"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2
                id="location-heading"
                className="font-serif text-[20px] font-semibold text-ink"
              >
                Location &amp; service area
              </h2>
              <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[11.5px] font-medium text-mut">
                Approximate area
              </span>
            </div>

            <div className="relative mt-4 aspect-[16/8.2] overflow-hidden rounded-[16px] border border-line bg-cream-2">
              <Image
                src="/images/manchester-map-placeholder.svg"
                alt={`Approximate service area map for ${provider.area}, Manchester`}
                fill
                unoptimized
                className="object-cover"
              />

              {/* Highlighted coverage circle + pin */}
              <div
                style={{
                  left: `${provider.mapPinPosition.xPercent}%`,
                  top: `${provider.mapPinPosition.yPercent}%`,
                }}
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
              >
                <span className="flex size-28 items-center justify-center rounded-full border-2 border-leaf-700/45 bg-leaf-600/15">
                  <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border-2 border-surface bg-leaf-900 px-3 py-1 text-[12px] font-bold text-cream shadow-lift">
                    <MapPin
                      className="size-3.5 shrink-0 text-gold-400"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    <span>{provider.area}</span>
                  </span>
                </span>
              </div>

              <span className="absolute bottom-3 left-3 rounded-full border border-line bg-surface/92 px-3 py-1 text-[11.5px] font-medium text-ink-2 shadow-xs backdrop-blur-xs">
                Map preview · Interactive maps coming soon
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[13px]">
              <p className="inline-flex items-center gap-1.5 font-medium text-ink-2">
                <MapPin
                  className="size-3.5 shrink-0 text-leaf-600"
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
                <span>
                  {provider.area}, Manchester · {provider.serviceRadiusLabel}
                </span>
              </p>
              <p className="text-[12px] text-mut">
                Exact address shared after booking confirmation
              </p>
            </div>
          </section>

          {/* Reviews Card */}
          <section
            aria-labelledby="reviews-heading"
            className="rounded-[20px] border border-line bg-surface p-6 shadow-soft"
          >
            <h2
              id="reviews-heading"
              className="font-serif text-[20px] font-semibold text-ink"
            >
              Reviews
            </h2>

            <div className="mt-4 grid grid-cols-1 items-center gap-6 sm:grid-cols-[136px_1fr]">
              <div>
                <p className="font-serif text-[44px] leading-none font-bold text-ink tabular-nums">
                  {provider.rating.toFixed(1)}
                </p>
                <div className="mt-2 flex items-center gap-0.5" aria-hidden="true">
                  {STARS.map((index) => (
                    <Star
                      key={index}
                      className="size-3.5 fill-gold-500 text-gold-500"
                    />
                  ))}
                </div>
                <p className="mt-1 text-[12.5px] text-mut tabular-nums">
                  {provider.reviews} reviews
                </p>
              </div>

              <div className="flex flex-col gap-2">
                {provider.ratingBreakdown.map((row) => {
                  const pct = Math.round((row.count / maxBreakdownCount) * 100);
                  return (
                    <div
                      key={row.stars}
                      className="flex items-center gap-2.5 text-[12px]"
                    >
                      <span className="inline-flex w-7 items-center gap-0.5 font-semibold text-ink-2 tabular-nums">
                        <span>{row.stars}</span>
                        <Star
                          className="size-3 fill-gold-500 text-gold-500"
                          aria-hidden="true"
                        />
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                        <motion.div
                          initial={reduce ? false : { scaleX: 0 }}
                          whileInView={{ scaleX: 1 }}
                          viewport={{ once: true, amount: 0.2 }}
                          transition={{
                            type: "spring",
                            bounce: 0,
                            duration: 0.55,
                          }}
                          className="h-full origin-left rounded-full bg-linear-to-r from-grad-gold-1 to-grad-gold-2"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-mut tabular-nums">
                        {row.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-4 border-t border-line pt-5">
              {provider.reviewList.map((review) => (
                <div key={review.id} className="flex items-start gap-3">
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full font-serif text-[12.5px] font-bold text-cream",
                      review.avatarClass,
                    )}
                  >
                    {review.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13.5px] font-semibold text-ink">
                        {review.author}
                      </span>
                      <div
                        className="flex items-center gap-0.5"
                        aria-label={`${review.rating} out of 5 stars`}
                      >
                        {STARS.map((index) => (
                          <Star
                            key={index}
                            className="size-3 fill-gold-500 text-gold-500"
                            aria-hidden="true"
                          />
                        ))}
                      </div>
                      <span className="text-[12px] text-mut">
                        {review.timeAgo}
                      </span>
                    </div>
                    <p className="mt-1 text-[13.5px] leading-relaxed text-ink-2">
                      {review.comment}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-5 flex items-center gap-1.5 text-[12px] text-mut">
              <ShieldCheck
                className="size-3.5 shrink-0 text-leaf-600"
                strokeWidth={1.85}
                aria-hidden="true"
              />
              <span>
                Reviews come from completed bookings only and are moderated.
              </span>
            </p>
          </section>
        </div>

        {/* Sticky Dark Emerald Booking Sidebar */}
        <aside
          aria-label="Booking summary"
          className="overflow-hidden rounded-[22px] border border-cream/10 bg-leaf-900 p-6 text-cream shadow-lift lg:sticky lg:top-[calc(var(--sv-hdr-h)+20px)]"
          style={{ backgroundImage: "var(--sv-diamond-pattern)" }}
        >
          <h2 className="font-serif text-[22px] font-semibold text-gold-300">
            Book this provider
          </h2>

          <AnimatePresence mode="wait" initial={false}>
          {bookingConfirmed && selectedOffering && activeDay && selectedTime ? (
            <motion.div
              key="confirmed"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={APPLE_SPRING_SNAPPY}
              className="mt-4"
            >
              <div className="rounded-[16px] border border-leaf-400/35 bg-leaf-950/60 p-4">
                <p className="inline-flex items-center gap-2 text-[14px] font-bold text-gold-300">
                  <CheckCircle2
                    className="size-4.5 text-leaf-300"
                    aria-hidden="true"
                  />
                  <span>Booking request confirmed</span>
                </p>
                <p className="mt-1 text-[12px] text-cream-75 tabular-nums">
                  Reference #SV-4821 · Demo checkout (no charge)
                </p>

                <dl className="mt-3.5 flex flex-col gap-2 border-t border-cream-line pt-3 text-[13px]">
                  <div className="flex justify-between gap-3">
                    <dt className="text-cream-60">Service</dt>
                    <dd className="text-right font-semibold text-cream">
                      {selectedOffering.name}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-cream-60">When</dt>
                    <dd className="font-semibold text-cream tabular-nums">
                      {activeDay.weekday} {activeDay.dayNum}{" "}
                      {activeDay.monthLabel} · {selectedTime}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-cream-60">Protected total</dt>
                    <dd className="font-serif text-[16px] font-bold text-gold-300 tabular-nums">
                      {formatGBP(totalAmount)}
                    </dd>
                  </div>
                </dl>
              </div>

              <button
                type="button"
                onClick={() => setBookingConfirmed(false)}
                className="mt-4 w-full cursor-pointer rounded-full border border-cream/20 py-2.5 text-[13px] font-semibold text-cream-85 transition-colors hover:bg-cream/10 hover:text-cream"
              >
                Change service or slot
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="selector"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={APPLE_SPRING_SNAPPY}
            >
              <div className="mt-4 flex flex-col gap-2.5 text-[13.5px]">
                <button
                  type="button"
                  onClick={() => scrollToSection("services-menu")}
                  className="flex cursor-pointer items-center justify-between gap-2 text-left transition-colors hover:text-cream"
                >
                  {selectedOffering ? (
                    <span className="inline-flex items-center gap-2 font-semibold text-cream">
                      <Check
                        className="size-4 shrink-0 text-gold-400"
                        strokeWidth={2.25}
                        aria-hidden="true"
                      />
                      <span className="truncate">{selectedOffering.name}</span>
                    </span>
                  ) : (
                    <span className="text-cream-75">
                      1 · Choose a service from the list
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => scrollToSection("availability")}
                  className="flex cursor-pointer items-center justify-between gap-2 text-left transition-colors hover:text-cream"
                >
                  {selectedTime && activeDay ? (
                    <span className="inline-flex items-center gap-2 font-semibold text-cream tabular-nums">
                      <Check
                        className="size-4 shrink-0 text-gold-400"
                        strokeWidth={2.25}
                        aria-hidden="true"
                      />
                      <span>
                        {activeDay.weekday} {activeDay.dayNum}{" "}
                        {activeDay.monthLabel} · {selectedTime}
                      </span>
                    </span>
                  ) : (
                    <span className="text-cream-75">
                      2 · Pick a day and time above
                    </span>
                  )}
                </button>
              </div>

              {selectedOffering && (
                <div className="mt-4 flex flex-col gap-1.5 border-t border-cream-line pt-3.5 text-[13px] tabular-nums">
                  <div className="flex items-center justify-between text-cream-75">
                    <span>Service price</span>
                    <span>{formatGBP(selectedOffering.price)}</span>
                  </div>
                  <div className="flex items-center justify-between text-cream-75">
                    <span>Protected fee (10%)</span>
                    <span>{formatGBP(bookingFee)}</span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between border-t border-cream-line pt-2.5">
                    <span className="text-[14px] font-semibold text-cream">
                      Total
                    </span>
                    <span className="font-serif text-[20px] font-bold text-gold-300">
                      {formatGBP(totalAmount)}
                    </span>
                  </div>
                </div>
              )}

              {bookingHint && (
                <p className="mt-3 rounded-[10px] border border-gold-400/35 bg-leaf-950/60 px-3 py-2 text-[12px] font-medium text-gold-300">
                  {bookingHint}
                </p>
              )}

              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={handleBookAndPay}
                className={cn(
                  "mt-5 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full px-5 py-3.5 text-[14.5px] font-bold transition-[filter,background-color]",
                  selectedOffering && selectedTime
                    ? "bg-linear-to-b from-grad-gold-1 to-grad-gold-2 text-gold-ink shadow-gold hover:brightness-[1.03]"
                    : "bg-gold-500/45 text-gold-ink/85 hover:bg-gold-500/60",
                )}
              >
                <span>Book &amp; pay</span>
                <ArrowRight
                  className="size-4"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </motion.button>
            </motion.div>
          )}
          </AnimatePresence>

          <div className="mt-5 flex flex-col gap-2.5 border-t border-cream-line pt-4 text-[12px] leading-relaxed text-cream-75">
            <p className="flex items-start gap-2">
              <ShieldCheck
                className="mt-0.5 size-4 shrink-0 text-gold-400"
                strokeWidth={1.85}
                aria-hidden="true"
              />
              <span>
                <strong className="font-semibold text-cream">
                  Protected payment.
                </strong>{" "}
                Released when you confirm completion, or 48h after your provider
                marks it done.{" "}
                <Link
                  href="/#protected-payment"
                  className="font-semibold text-gold-300 underline decoration-gold-300/60 underline-offset-2 hover:text-gold-400"
                >
                  How it works
                </Link>
              </span>
            </p>

            <p className="flex items-start gap-2">
              <RotateCcw
                className="mt-0.5 size-4 shrink-0 text-gold-400"
                strokeWidth={1.85}
                aria-hidden="true"
              />
              <span>
                Free cancellation up to 48h before.{" "}
                <Link
                  href="/#how-it-works"
                  className="font-semibold text-gold-300 underline decoration-gold-300/60 underline-offset-2 hover:text-gold-400"
                >
                  Policy
                </Link>
              </span>
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
