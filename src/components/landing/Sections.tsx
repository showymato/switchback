"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { ease, subscribeScroll, useInView, useParallax, useScrollProgress } from "./scroll";
import { ScrollSequence, type SequenceFrame } from "./Sequence";

/**
 * "Treadmill": a second scrubbed sequence that starts inset with rounded corners and
 * slightly zoomed, then eases out to full-bleed as it scrolls into place.
 */
export function Treadmill({ frames, video }: { frames: SequenceFrame[]; video?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const areaRef = useScrollProgress<HTMLDivElement>({
    offset: "0%,100%",
    map: ease.sineInOut,
    target: rootRef,
  });

  return (
    <div ref={rootRef} className="sb-treadmill sb-dust">
      <div className="sb-treadmill_inner">
        <ScrollSequence className="sb-treadmill_seq" media={{ frames, video }} folds={6.43} offset="100%,100%" />
        <div ref={areaRef} className="sb-treadmill_area" aria-hidden />
      </div>
    </div>
  );
}

/** Night-sky "camp" section: big masked title, coordinates, parallax clouds and foreground. */
export function Camp({
  lines,
  coordsBefore,
  coordsAfter,
  text,
  foreground,
  badge,
}: {
  lines: string[];
  coordsBefore: string;
  coordsAfter: string;
  text: string;
  foreground: SequenceFrame;
  badge?: string;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const contentRef = useScrollProgress<HTMLDivElement>({
    offset: "0,50%",
    onProgress: (p) => {
      lineRefs.current.forEach((el, i) => {
        if (!el) return;
        const local = Math.min(1, Math.max(0, (p * 1.6 - i * 0.15) / 0.6));
        el.style.transform = `translate3d(0, ${((1 - ease.power4Out(local)) * 105).toFixed(2)}%, 0)`;
      });
    },
  });
  const parallaxContent = useParallax<HTMLDivElement>(0.03);
  const cloudLg = useParallax<HTMLDivElement>(0.1);
  const cloudMd = useParallax<HTMLDivElement>(0.04);
  const cloudSm = useParallax<HTMLDivElement>(0.02);

  // The overlay hangs above the section and darkens the previous fold as night falls.
  useEffect(() => {
    return subscribeScroll(() => {
      const el = overlayRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // Starts once the overlay fully covers the pinned treadmill, then deepens as the
      // camp section rises over it, so there is never a visible edge.
      const p = Math.min(1, Math.max(0, -rect.top / (vh * 0.6)));
      el.style.setProperty("--progress", p.toFixed(4));
    });
  }, []);

  return (
    <div className="sb-camp">
      <div ref={overlayRef} className="sb-camp_overlay" aria-hidden />
      <div className="sb-camp_stars" aria-hidden />
      <div ref={parallaxContent}>
        <div ref={contentRef} className="sb-camp_content">
          <h2 className="sb-camp_title" data-before={coordsBefore} data-after={coordsAfter} aria-label={lines.join(" ")}>
            {lines.map((line, i) => (
              <span key={i} aria-hidden>
                <span ref={(el) => void (lineRefs.current[i] = el)}>{line}</span>
              </span>
            ))}
          </h2>
          <div className="sb-camp_text">
            <p>{text}</p>
          </div>
          {badge && <span className="sb-camp_badge">{badge}</span>}
        </div>
      </div>
      <div className="sb-camp_clouds" aria-hidden>
        <div ref={cloudLg} className="sb-cloud -lg" />
        <div ref={cloudMd} className="sb-cloud -md" />
        <div ref={cloudSm} className="sb-cloud -sm" />
      </div>
      <div className="sb-camp_foreground">
        <Image
          src={foreground.src}
          alt=""
          fill
          sizes="100vw"
          style={{ objectFit: "cover", objectPosition: foreground.position ?? "50% 100%" }}
        />
      </div>
    </div>
  );
}

/** Large image card that settles from 110% scale as it scrolls through, with hover zoom. */
export function ProductTile({
  href,
  image,
  imagePosition,
  title,
  subtitle,
  cta = "Discover",
  delay = 0,
}: {
  href: string;
  image: string;
  imagePosition?: string;
  title: string;
  subtitle: string;
  cta?: string;
  delay?: number;
}) {
  const imgRef = useRef<HTMLDivElement>(null);
  const inViewRef = useInView<HTMLDivElement>();
  const ref = useScrollProgress<HTMLDivElement>({
    offset: "0,0",
    cssVar: false,
    onProgress: (p) => {
      const s = 1 + (1 - ease.power2Out(p)) * 0.1;
      if (imgRef.current) imgRef.current.style.transform = `scale(${s.toFixed(4)})`;
    },
  });

  return (
    <div ref={ref}>
      <div ref={inViewRef} className="sb-anim-parent">
        <article className={cn("sb-ptile sb-btn-hover sb-anim -parent", delay && `-delay-${delay}`)}>
          <div className="sb-ptile_bg">
            <div ref={imgRef} className="sb-ptile_image">
              <Image src={image} alt="" fill sizes="(min-width: 700px) 50vw, 100vw" style={{ objectFit: "cover", objectPosition: imagePosition }} />
            </div>
          </div>
          <div className="sb-ptile_head">
            <h3 className="sb-ptile_title">{title}</h3>
            <span className="sb-ptile_subtitle">{subtitle}</span>
          </div>
          <div className="sb-ptile_foot">
            <span aria-hidden className="sb-button -primary">{cta}</span>
          </div>
          <Link href={href} className="sb-cover-link">
            {cta} {title}
          </Link>
        </article>
      </div>
    </div>
  );
}

/** Orange "dust" tile with a notched divider — the floating booking card. */
export function BookTile({
  href,
  head,
  cta,
  className,
}: {
  href: string;
  head: React.ReactNode;
  cta: string;
  className?: string;
}) {
  return (
    <div className={cn("sb-book sb-btn-hover", className)}>
      <div className="sb-book_head">{head}</div>
      <hr className="sb-book_hr" />
      <div className="sb-book_cta" aria-hidden>
        <span className="sb-button -transparent -full">{cta}</span>
      </div>
      <Link href={href} className="sb-cover-link">
        {cta}
      </Link>
    </div>
  );
}
