"use client";

import { motion, useReducedMotion } from "motion/react";

const LINES = ["Take the road", "less ordinary."];

/**
 * Line-by-line masked reveal for the hero headline: each line sits inside an
 * overflow-hidden wrapper (the "mask") and slides up from fully hidden to in place,
 * staggered. Server-rendered markup already contains the full text for SEO/assistive
 * tech — this only animates the already-present DOM, so nothing is read twice and
 * nothing shifts layout once settled.
 */
export function HeroHeadline() {
  const reduceMotion = useReducedMotion();

  return (
    <h1 className="mt-3 font-heading text-4xl leading-[1.08] text-[#f7f4ec] sm:text-5xl lg:text-6xl">
      {LINES.map((line, i) => (
        <span key={line} className="block overflow-hidden">
          <motion.span
            className="block"
            initial={{ y: reduceMotion ? 0 : "100%", opacity: reduceMotion ? 1 : 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: reduceMotion ? 0.2 : 0.7, delay: reduceMotion ? 0 : 0.15 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </h1>
  );
}
