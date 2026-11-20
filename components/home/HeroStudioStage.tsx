"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type PanInfo,
} from "motion/react";
import {
  HeroArtwork,
  type HeroArtworkScene,
} from "@/components/home/HeroArtwork";
import { cn } from "@/lib/utils";

interface StudioSlide {
  id: HeroArtworkScene;
  name: string;
  subtitle: string;
  slot: string;
  status: string;
  badge: string;
}

const STUDIOS = [
  {
    id: "amara",
    name: "Amara Hair & Beauty",
    subtitle: "Hulme · Knotless braids",
    slot: "Sat 10:30",
    status: "Verified studio",
    badge: "Hulme · Open Sat",
  },
  {
    id: "kingsman",
    name: "Kingsman Cuts",
    subtitle: "Cheetham Hill · Skin fades",
    slot: "Today 16:00",
    status: "Instant book",
    badge: "Cheetham Hill · Open today",
  },
  {
    id: "littlesteps",
    name: "Little Steps Childminding",
    subtitle: "Salford · After-school care",
    slot: "Mon 15:30",
    status: "Enhanced DBS",
    badge: "Salford · DBS checked",
  },
] as const satisfies ReadonlyArray<StudioSlide>;

const AUTO_SLIDE_MS = 4500;

/** Exponential momentum projection per Apple Designing Fluid Interfaces (WWDC 2018). */
function project(initialVelocity: number, decelerationRate = 0.992): number {
  return ((initialVelocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 24 : -24,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -24 : 24,
    opacity: 0,
  }),
};

const artworkSlideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 1,
    zIndex: 2,
  }),
  center: {
    x: "0%",
    opacity: 1,
    zIndex: 2,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? "-24%" : "24%",
    opacity: 1,
    zIndex: 1,
  }),
};

export function HeroStudioStage() {
  const shouldReduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [direction, setDirection] = React.useState(1);
  const [isPaused, setIsPaused] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isFocusWithin, setIsFocusWithin] = React.useState(false);

  const activeStudio = STUDIOS[activeIndex] ?? STUDIOS[0];
  const isAutoPlaying =
    !isPaused && !isDragging && !isFocusWithin && !shouldReduceMotion;

  React.useEffect(() => {
    const studioParam = new URLSearchParams(window.location.search).get(
      "studio",
    );
    if (!studioParam) return;
    const matchIndex = STUDIOS.findIndex(
      (studio) => studio.id === studioParam,
    );
    if (matchIndex < 0) return;

    const frameId = window.requestAnimationFrame(() => {
      setActiveIndex(matchIndex);
    });
    return () => window.cancelAnimationFrame(frameId);
  }, []);

  React.useEffect(() => {
    if (!isAutoPlaying) return;

    let timerId: number | undefined;
    const scheduleNext = () => {
      window.clearTimeout(timerId);
      if (document.hidden) return;
      timerId = window.setTimeout(() => {
        setDirection(1);
        setActiveIndex((prev) => (prev + 1) % STUDIOS.length);
      }, AUTO_SLIDE_MS);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        window.clearTimeout(timerId);
      } else {
        scheduleNext();
      }
    };

    scheduleNext();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.clearTimeout(timerId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activeIndex, isAutoPlaying]);

  function goToRelative(step: -1 | 1) {
    setDirection(step);
    setActiveIndex(
      (prev) => (prev + step + STUDIOS.length) % STUDIOS.length,
    );
  }

  function selectIndex(nextIndex: number) {
    if (nextIndex === activeIndex || nextIndex < 0 || nextIndex >= STUDIOS.length) {
      return;
    }
    setDirection(nextIndex > activeIndex ? 1 : -1);
    setActiveIndex(nextIndex);
  }

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    setIsDragging(false);
    const projected = info.offset.x + project(info.velocity.x, 0.992);
    if (projected < -56) {
      goToRelative(1);
    } else if (projected > 56) {
      goToRelative(-1);
    }
  }

  return (
    <figure
      onFocusCapture={(e) => {
        if (
          e.target instanceof HTMLElement &&
          e.target.matches(":focus-visible")
        ) {
          setIsFocusWithin(true);
        }
      }}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setIsFocusWithin(false);
        }
      }}
      className="relative overflow-hidden rounded-[20px] border border-cream/10 bg-leaf-950 shadow-[0_16px_40px_rgba(7,30,22,0.35)]"
    >
      <div className="relative aspect-[600/760] w-full overflow-hidden">
        <motion.div
          drag={shouldReduceMotion ? false : "x"}
          dragDirectionLock
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.18}
          dragTransition={{ bounceStiffness: 320, bounceDamping: 26 }}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleDragEnd}
          className="relative z-[1] h-full w-full touch-pan-y cursor-grab overflow-hidden active:cursor-grabbing"
        >
          <AnimatePresence mode="sync" custom={direction} initial={false}>
            <motion.div
              key={activeStudio.id}
              custom={direction}
              variants={
                shouldReduceMotion
                  ? {
                      enter: { opacity: 0, zIndex: 2 },
                      center: { opacity: 1, zIndex: 2 },
                      exit: { opacity: 1, zIndex: 1 },
                    }
                  : artworkSlideVariants
              }
              initial="enter"
              animate="center"
              exit="exit"
              transition={
                shouldReduceMotion
                  ? { duration: 0.25 }
                  : { type: "spring", bounce: 0, duration: 0.56 }
              }
              className={cn(
                "absolute inset-0",
                direction > 0
                  ? "shadow-[-20px_0_40px_rgba(7,30,22,0.42)]"
                  : "shadow-[20px_0_40px_rgba(7,30,22,0.42)]",
              )}
            >
              <HeroArtwork
                scene={activeStudio.id}
                paused={isPaused || Boolean(shouldReduceMotion)}
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Top-left Play / Pause control matching glass pill aesthetics */}
        {!shouldReduceMotion && (
          <motion.button
            type="button"
            onClick={() => setIsPaused((prev) => !prev)}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", duration: 0.2, bounce: 0 }}
            aria-pressed={isPaused}
            aria-label={isPaused ? "Play hero showcase" : "Pause hero showcase"}
            title={isPaused ? "Play showcase" : "Pause showcase"}
            className="apple-glass-dock absolute top-4 left-4 z-[3] flex size-8 cursor-pointer items-center justify-center rounded-full border border-cream/15 text-cream/90 transition-colors hover:border-cream/30 hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/75"
          >
            {isPaused ? (
              <Play
                className="size-3.5 translate-x-[0.5px]"
                strokeWidth={1.75}
                aria-hidden="true"
              />
            ) : (
              <Pause
                className="size-3.5"
                strokeWidth={1.75}
                aria-hidden="true"
              />
            )}
          </motion.button>
        )}

        {/* Top-right translucent area badge */}
        <div className="apple-glass-dock pointer-events-none absolute top-4 right-4 z-[3] overflow-hidden rounded-full border border-cream/15 px-3 py-1.5 text-[12px] font-medium text-cream">
          <AnimatePresence mode="wait">
            <motion.span
              key={activeStudio.id}
              initial={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 4, scale: 0.96 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: -4, scale: 0.96 }
              }
              transition={{ type: "spring", bounce: 0, duration: 0.28 }}
              className="block whitespace-nowrap"
            >
              {activeStudio.badge}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      <figcaption className="apple-glass-dock border-t border-cream/12 px-5 py-4">
        <motion.div
          drag={shouldReduceMotion ? false : "x"}
          dragDirectionLock
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.28}
          dragTransition={{ bounceStiffness: 320, bounceDamping: 26 }}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleDragEnd}
          className="touch-pan-y cursor-grab overflow-hidden active:cursor-grabbing"
        >
          <AnimatePresence mode="popLayout" custom={direction} initial={false}>
            <motion.div
              key={activeStudio.id}
              custom={direction}
              variants={
                shouldReduceMotion
                  ? {
                      enter: { opacity: 0 },
                      center: { opacity: 1 },
                      exit: { opacity: 0 },
                    }
                  : slideVariants
              }
              initial="enter"
              animate="center"
              exit="exit"
              transition={
                shouldReduceMotion
                  ? { duration: 0.2 }
                  : { type: "spring", bounce: 0.14, duration: 0.38 }
              }
              className="flex items-center justify-between gap-4 select-none"
            >
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium text-cream">
                  {activeStudio.name}
                </p>
                <p className="truncate text-[12px] text-cream-60">
                  {activeStudio.subtitle}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[13px] font-medium text-cream-75 tabular-nums">
                  {activeStudio.slot}
                </p>
                <p className="text-[12px] text-leaf-300">
                  {activeStudio.status}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="Featured Manchester providers"
            className="flex items-center gap-1.5"
          >
            {STUDIOS.map((studio, index) => {
              const isSelected = index === activeIndex;
              return (
                <button
                  key={studio.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  aria-label={`Show ${studio.name}`}
                  onClick={() => selectIndex(index)}
                  className={cn(
                    "relative h-1.5 cursor-pointer rounded-full transition-[width,background-color] duration-200 ease-standard",
                    isSelected
                      ? "w-9 bg-cream/25"
                      : "w-2.5 bg-cream/25 hover:bg-cream/45"
                  )}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="studio-dock-dot"
                      transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                      className="absolute inset-0 overflow-hidden rounded-full bg-gold-400/25"
                    >
                      {isAutoPlaying ? (
                        <motion.span
                          key={activeStudio.id}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{
                            duration: AUTO_SLIDE_MS / 1000,
                            ease: "linear",
                          }}
                          className="block h-full w-full origin-left rounded-full bg-gold-400"
                        />
                      ) : (
                        <span className="block h-full w-full rounded-full bg-gold-400" />
                      )}
                    </motion.span>
                  )}
                </button>
              );
            })}
            <span className="ml-2 text-[11px] font-medium text-cream-60 tabular-nums">
              0{activeIndex + 1} / 0{STUDIOS.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={() => goToRelative(-1)}
              aria-label="Previous provider"
              className="inline-flex size-7 cursor-pointer items-center justify-center rounded-[8px] border border-cream/10 bg-white/[0.04] text-cream-85 transition-colors duration-150 ease-standard hover:bg-white/[0.1]"
            >
              <ChevronLeft
                className="size-4"
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={() => goToRelative(1)}
              aria-label="Next provider"
              className="inline-flex size-7 cursor-pointer items-center justify-center rounded-[8px] border border-cream/10 bg-white/[0.04] text-cream-85 transition-colors duration-150 ease-standard hover:bg-white/[0.1]"
            >
              <ChevronRight
                className="size-4"
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </motion.button>
          </div>
        </div>
      </figcaption>
    </figure>
  );
}
