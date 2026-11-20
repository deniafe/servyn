"use client";

import * as React from "react";
import {
  motion,
  useReducedMotion,
  type HTMLMotionProps,
  type Transition,
  type Variants,
} from "motion/react";

/**
 * Shared Apple-style critically-damped spring presets (WWDC Designing Fluid Interfaces).
 * Critically damped (`bounce: 0`) by default so transitions feel physical,
 * interruptible, and velocity-preserving without gratuitous overshoot.
 */
export const APPLE_SPRING: Transition = {
  type: "spring",
  bounce: 0,
  duration: 0.42,
};

export const APPLE_SPRING_SNAPPY: Transition = {
  type: "spring",
  bounce: 0,
  duration: 0.3,
};

export const APPLE_SPRING_TACTILE: Transition = {
  type: "spring",
  stiffness: 520,
  damping: 34,
  mass: 0.85,
};

export interface StaggerMotion {
  /** Apply to the grid container: `variants={container} initial="hidden" animate="show"`. */
  container: Variants;
  /** Apply to each card: `variants={item}`. */
  item: Variants;
  /** Spread onto each card for hover/tap lift (springs, no overshoot). */
  cardProps: Pick<HTMLMotionProps<"article">, "whileHover" | "whileTap">;
}

/**
 * Spring-based staggered entrance for product/provider grids.
 * Under `prefers-reduced-motion`, collapses to a short opacity cross-fade.
 */
export function useStaggerMotion(stagger = 0.05): StaggerMotion {
  const reduce = useReducedMotion();

  return React.useMemo<StaggerMotion>(() => {
    if (reduce) {
      return {
        container: {
          hidden: {},
          show: { transition: { staggerChildren: stagger * 0.5 } },
        },
        item: {
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { duration: 0.18 } },
        },
        cardProps: {},
      };
    }

    return {
      container: {
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: 0.02 } },
      },
      item: {
        hidden: { opacity: 0, y: 16, scale: 0.985 },
        show: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { type: "spring", bounce: 0, duration: 0.46 },
        },
      },
      cardProps: {
        whileHover: {
          y: -4,
          transition: { type: "spring", bounce: 0, duration: 0.28 },
        },
        whileTap: {
          scale: 0.985,
          transition: { type: "spring", bounce: 0, duration: 0.16 },
        },
      },
    };
  }, [reduce, stagger]);
}

/** A gentle masthead/heading reveal — opacity + small rise, reduced-motion safe. */
export function useRevealMotion() {
  const reduce = useReducedMotion();
  return React.useMemo(() => {
    if (reduce) {
      return {
        initial: { opacity: 0 } as const,
        animate: { opacity: 1 } as const,
        transition: { duration: 0.18 } as const,
      };
    }
    return {
      initial: { opacity: 0, y: 12 } as const,
      animate: { opacity: 1, y: 0 } as const,
      transition: { type: "spring", bounce: 0, duration: 0.5 } as const,
    };
  }, [reduce]);
}

/**
 * Scroll-triggered fluid section reveal — animates once when scrolled into view.
 */
export function ScrollReveal({
  children,
  className,
  delay = 0,
  y = 18,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ type: "spring", bounce: 0, duration: 0.5, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Interactive Apple-style heart pulse wrapper for favourite buttons.
 */
export function HeartPulse({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      key={active ? "saved" : "unsaved"}
      initial={reduce ? false : { scale: active ? 0.72 : 1 }}
      animate={reduce ? undefined : { scale: active ? [0.72, 1.24, 0.96, 1] : 1 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="inline-flex items-center justify-center"
    >
      {children}
    </motion.span>
  );
}
