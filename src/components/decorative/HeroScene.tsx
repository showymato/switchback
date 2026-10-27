"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

/**
 * Real photography: a Royal Enfield Himalayan (the same motorcycle family as the
 * "Royal Enfield Himalayan 450" listing seeded in the database) in genuine high-Himalaya
 * terrain. Sourced from Pexels under the Pexels License (free for commercial use) — see
 * public/images/CREDITS.md for the photographer credit and source link. Not a photo of
 * an actual Switchback partner vehicle; this is brand/mood photography for the hero,
 * the same way any travel brand's hero image isn't literally "their" fleet.
 */
export function HeroScene() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#1c2a21]">
      <motion.div
        className="absolute inset-0"
        initial={{ clipPath: "inset(0 0 0 100%)" }}
        animate={{ clipPath: "inset(0 0 0 0%)" }}
        transition={{ duration: reduceMotion ? 0 : 1.1, ease: [0.76, 0, 0.24, 1] }}
      >
        <motion.div
          className="absolute inset-0"
          initial={{ scale: reduceMotion ? 1 : 1.12 }}
          animate={{ scale: 1 }}
          transition={{ duration: reduceMotion ? 0 : 1.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <Image
            src="/images/hero-himalaya.jpg"
            alt="A Royal Enfield Himalayan motorcycle parked on a high mountain road in the Himalayas, with snow-capped peaks beyond"
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </motion.div>
      </motion.div>

      {/* A soft gradient at the seam where the photo meets the dark hero panel, so the
          join reads as deliberate composition rather than a hard crop. */}
      <div className="absolute inset-y-0 left-0 hidden w-10 bg-gradient-to-r from-[#102A20]/90 to-transparent lg:block" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#102A20]/70 to-transparent lg:hidden" />
    </div>
  );
}
