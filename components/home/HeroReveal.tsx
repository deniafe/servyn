"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";

interface HeroRevealItemProps {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  blur?: boolean;
  scale?: number;
  className?: string;
}

export function HeroRevealItem({
  children,
  delay = 0,
  y = 14,
  blur = false,
  scale = 1,
  className,
}: HeroRevealItemProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0 }}
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{
        opacity: 0,
        y,
        scale,
        ...(blur ? { filter: "blur(5px)" } : {}),
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        ...(blur ? { filter: "blur(0px)" } : {}),
      }}
      transition={{
        type: "spring",
        bounce: 0,
        duration: 0.62,
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
