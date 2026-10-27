"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Scroll-aware header surface: transparent over the homepage hero, solidifying with a
 * blurred ivory surface once the visitor scrolls past it. On every other page (no tall
 * hero to blend with) it's solid from the start, so content is never ambiguous.
 */
export function HeaderChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(!isHome);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (v) => {
    if (isHome) setScrolled(v > 72);
  });

  return (
    <motion.header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-colors duration-300",
        scrolled
          ? "border-b border-border bg-background/90 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      )}
      initial={false}
    >
      <div className={cn(!scrolled && isHome ? "text-[#f7f4ec]" : "text-foreground")}>{children}</div>
    </motion.header>
  );
}
