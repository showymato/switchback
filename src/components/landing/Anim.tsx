"use client";

import { createElement } from "react";
import { cn } from "@/lib/utils";
import { useInView } from "./scroll";

/** Fade + nudge up once in view (`u-anim-scroll`), with optional stagger step 0–4 (50ms each). */
export function AnimScroll({
  as = "div",
  delay = 0,
  className,
  children,
  ...rest
}: {
  as?: "div" | "h2" | "p" | "section" | "hr";
  delay?: number;
  className?: string;
  children?: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>) {
  const ref = useInView<HTMLElement>();
  return createElement(
    as,
    { ref, className: cn("sb-anim", delay && `-delay-${delay}`, className), ...rest },
    children
  );
}

/**
 * Line-by-line word reveal with an orange hand-drawn underline per line (`c-splitlines`).
 * Inside a sequence key it animates with the key's `is-active`; standalone it animates
 * when scrolled into view.
 */
export function SplitLines({
  lines,
  as: Tag = "h2",
  className,
  standalone = false,
  underline = true,
}: {
  lines: string[];
  as?: "h1" | "h2" | "h3";
  className?: string;
  standalone?: boolean;
  underline?: boolean;
}) {
  const ref = useInView<HTMLDivElement>({ threshold: 0.2 });
  return (
    <div ref={standalone ? ref : undefined} className="sb-split" data-anim={standalone ? "" : undefined}>
      <Tag className={cn(className, "lines")} aria-label={lines.join(" ")}>
        {lines.map((line, i) => (
          <span key={i} className="sb-split_item" aria-hidden style={{ "--line-index": i } as React.CSSProperties}>
            <span className="sb-split_mask">
              {line.split(" ").map((word, w) => (
                <span key={w} className="word">
                  {word}
                  {w < line.split(" ").length - 1 ? " " : ""}
                </span>
              ))}
            </span>
            {underline && i === lines.length - 1 && (
              <svg className="sb-split_shape" viewBox="0 0 100 10" preserveAspectRatio="none" fill="none">
                <path d="M2 6.5C24 3.5 48 3 70 4.6S92 7.4 98 4" pathLength={100} strokeWidth={1.2} strokeLinecap="round" />
              </svg>
            )}
          </span>
        ))}
      </Tag>
    </div>
  );
}
