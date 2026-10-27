"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Lenis smooth scrolling plus the document-level flags the landing CSS keys off:
 * `is-ready` (enables entrance transitions once hydrated), `--vw` (scrollbar-free
 * viewport width) and `lvh-svh-different` (mobile browser chrome detection).
 */
export function SmoothScroll() {
  useEffect(() => {
    const html = document.documentElement;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const lenis = reduceMotion ? null : new Lenis({ lerp: 0.1, smoothWheel: true });
    let raf = 0;
    const loop = (time: number) => {
      lenis?.raf(time);
      raf = requestAnimationFrame(loop);
    };
    if (lenis) raf = requestAnimationFrame(loop);

    const measure = () => {
      html.style.setProperty("--vw", `${document.body.clientWidth * 0.01}px`);
      const probe = document.createElement("div");
      probe.style.cssText = "position:fixed;top:0;left:0;width:0;height:100lvh;";
      document.body.appendChild(probe);
      const lvh = probe.getBoundingClientRect().height;
      probe.style.height = "100svh";
      const svh = probe.getBoundingClientRect().height;
      probe.remove();
      html.classList.toggle("lvh-svh-different", lvh !== svh);
    };
    measure();
    window.addEventListener("resize", measure);
    html.classList.toggle("is-firefox", navigator.userAgent.includes("Firefox"));

    // Menu overlay locks page scroll while open.
    const observer = new MutationObserver(() => {
      if (html.classList.contains("has-menu-open")) lenis?.stop();
      else lenis?.start();
    });
    observer.observe(html, { attributes: true, attributeFilter: ["class"] });

    const ready = requestAnimationFrame(() => html.classList.add("is-ready"));

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(ready);
      window.removeEventListener("resize", measure);
      observer.disconnect();
      lenis?.destroy();
      html.classList.remove("is-ready", "lvh-svh-different", "is-firefox", "has-scrolled", "is-scrolling-up", "has-footer-inview");
    };
  }, []);

  return <div className="sb-preloader" aria-hidden />;
}
