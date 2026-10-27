"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";

/**
 * Fades/slides content in once as it enters the viewport. Centralizes the homepage's
 * scroll-choreography so every section uses the same easing/duration instead of
 * bespoke one-off animations. Respects prefers-reduced-motion by skipping the
 * transform entirely (opacity-only, near-instant) rather than just shortening it.
 */
export function Reveal({
  children,
  delay = 0,
  y = 22,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "span";
}) {
  const reduceMotion = useReducedMotion();

  const variants: Variants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : y },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduceMotion ? 0.15 : 0.6, delay: reduceMotion ? 0 : delay, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const MotionTag = as === "span" ? motion.span : motion.div;

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={variants}
    >
      {children}
    </MotionTag>
  );
}

/** A parent that staggers its Reveal children — pass `custom`-free Reveal children directly inside. */
export function RevealGroup({
  children,
  stagger = 0.08,
  className,
}: {
  children: React.ReactNode;
  stagger?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      transition={{ staggerChildren: reduceMotion ? 0 : stagger }}
    >
      {children}
    </motion.div>
  );
}
