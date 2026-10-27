"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

/**
 * Tiny scroll engine for the landing page. Every subscriber is re-run once per animation
 * frame while the page is scrolling or resizing, so dozens of scroll-linked elements cost
 * a single rAF instead of one listener each. Lenis drives window scrolling, so plain
 * window scroll events are enough to stay in sync with the smoothed position.
 */
type Subscriber = () => void;

const subscribers = new Set<Subscriber>();
let frame = 0;
let listening = false;

function flush() {
  frame = 0;
  subscribers.forEach((fn) => fn());
}

function schedule() {
  if (!frame) frame = requestAnimationFrame(flush);
}

export function subscribeScroll(fn: Subscriber) {
  subscribers.add(fn);
  if (!listening) {
    listening = true;
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
  }
  schedule();
  return () => {
    subscribers.delete(fn);
  };
}

export const clamp = (min: number, max: number, v: number) => Math.min(max, Math.max(min, v));

/** Parses a Locomotive-style offset ("0", "50%", "120") into pixels against the viewport height. */
function toPx(value: string, vh: number) {
  const v = value.trim();
  return v.endsWith("%") ? (parseFloat(v) / 100) * vh : parseFloat(v) || 0;
}

/**
 * Progress of an element through the viewport, matching Locomotive Scroll's `data-scroll-offset`:
 * 0 when the element's top reaches `viewport bottom - start`, 1 when its bottom reaches `end`
 * from the viewport top.
 */
export function elementProgress(el: Element, offset = "0,0") {
  const [s = "0", e = "0"] = offset.split(",");
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight;
  const y = -rect.top;
  const y0 = toPx(s, vh) - vh;
  const y1 = rect.height - toPx(e, vh);
  if (y1 <= y0) return y >= y1 ? 1 : 0;
  return clamp(0, 1, (y - y0) / (y1 - y0));
}

export const ease = {
  power2Out: (t: number) => 1 - Math.pow(1 - t, 3),
  power4Out: (t: number) => 1 - Math.pow(1 - t, 5),
  sineInOut: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
};

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Writes the element's scroll progress into its `--progress` custom property (the
 * equivalent of `data-scroll-css-progress`) and optionally reports it to `onProgress`.
 */
export function useScrollProgress<T extends HTMLElement>(
  options: {
    offset?: string;
    cssVar?: boolean;
    map?: (p: number) => number;
    onProgress?: (p: number) => void;
    target?: React.RefObject<HTMLElement | null>;
  } = {}
) {
  const ref = useRef<T>(null);
  const opts = useRef(options);
  useIsoLayoutEffect(() => {
    opts.current = options;
  });

  useIsoLayoutEffect(() => {
    let last = -1;
    return subscribeScroll(() => {
      const el = ref.current;
      if (!el) return;
      const { offset, cssVar = true, map, onProgress, target } = opts.current;
      const raw = elementProgress(el, offset);
      const p = map ? map(raw) : raw;
      if (p === last) return;
      last = p;
      if (cssVar) (target?.current ?? el).style.setProperty("--progress", p.toFixed(4));
      onProgress?.(p);
    });
  }, []);

  return ref;
}

/**
 * Toggles `is-inview` once the element enters the viewport (Locomotive's default
 * `data-scroll` behaviour). With `repeat`, the class is removed again on leave.
 */
export function useInView<T extends HTMLElement>({
  repeat = false,
  threshold = 0,
  onChange,
}: { repeat?: boolean; threshold?: number; onChange?: (inView: boolean) => void } = {}) {
  const ref = useRef<T>(null);
  const cb = useRef(onChange);
  useEffect(() => {
    cb.current = onChange;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-inview");
          cb.current?.(true);
          if (!repeat) io.disconnect();
        } else if (repeat) {
          el.classList.remove("is-inview");
          cb.current?.(false);
        }
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [repeat, threshold]);

  return ref;
}

/** Vertical parallax equivalent to `data-scroll-speed`. */
export function useParallax<T extends HTMLElement>(speed: number) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (window.matchMedia("(hover: none), (prefers-reduced-motion: reduce)").matches) return;
    return subscribeScroll(() => {
      const el = ref.current;
      const parent = el?.parentElement;
      if (!el || !parent) return;
      const rect = parent.getBoundingClientRect();
      const vh = window.innerHeight;
      if (rect.bottom < -vh || rect.top > vh * 2) return;
      const delta = rect.top + rect.height / 2 - vh / 2;
      el.style.transform = `translate3d(0, ${(-delta * speed).toFixed(2)}px, 0)`;
    });
  }, [speed]);

  return ref;
}
