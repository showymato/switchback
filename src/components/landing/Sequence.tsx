"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { subscribeScroll, useScrollProgress } from "./scroll";

export type SequenceFrame = { src: string; position?: string };

export type SequenceKey = {
  /** Start/end of the key as a fraction (0–1) of the sequence's scroll progress. */
  from: number;
  to: number;
  className?: string;
  children: React.ReactNode;
};

type Media = {
  /** Optional scrubbed video. Encode with dense keyframes (e.g. `-g 1`) for smooth scrubbing. */
  video?: string;
  /** Poster frames, cross-faded across the scroll when there is no video. */
  frames: SequenceFrame[];
};

function SequenceMedia({
  media,
  progressRef,
  onLoaded,
  priority,
}: {
  media: Media;
  progressRef: React.RefObject<number>;
  onLoaded: () => void;
  priority?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRefs = useRef<(HTMLDivElement | null)[]>([]);
  const zoomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return subscribeScroll(() => {
      const p = progressRef.current ?? 0;
      const video = videoRef.current;
      if (video && video.duration) {
        const t = p * (video.duration - 0.05);
        if (Math.abs(video.currentTime - t) > 0.01) video.currentTime = t;
        return;
      }
      const n = media.frames.length;
      const idx = p * (n - 1);
      frameRefs.current.forEach((el, i) => {
        if (!el) return;
        const d = Math.abs(i - idx);
        el.style.opacity = String(Math.max(0, Math.min(1, 1 - d)));
        // Each frame drifts slowly while visible, giving the stills a filmed feel.
        const local = idx - i;
        el.style.transform = `scale(${(1.12 - local * 0.06).toFixed(4)}) translate3d(${(local * -1.5).toFixed(3)}%, 0, 0)`;
      });
      if (zoomRef.current) zoomRef.current.style.transform = `scale(${(1 + (1 - p) * 0.04).toFixed(4)})`;
    });
  }, [media.frames.length, progressRef]);

  if (media.video) {
    return (
      <video
        ref={videoRef}
        className="sb-seq_media_element"
        src={media.video}
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        onLoadedData={onLoaded}
      />
    );
  }

  return (
    <div ref={zoomRef} className="sb-seq_frames">
      {media.frames.map((frame, i) => (
        <div key={frame.src + i} ref={(el) => void (frameRefs.current[i] = el)} className="sb-seq_frame" style={{ opacity: i === 0 ? 1 : 0 }}>
          <Image
            src={frame.src}
            alt=""
            fill
            sizes="100vw"
            priority={priority && i === 0}
            style={{ objectFit: "cover", objectPosition: frame.position ?? "50% 50%" }}
            onLoad={i === 0 ? onLoaded : undefined}
          />
        </div>
      ))}
    </div>
  );
}

/** Sticky, scroll-scrubbed media with timed content keys (`c-sequence -scroll`). */
export function ScrollSequence({
  media,
  folds,
  offset = "0,100%",
  keys = [],
  className,
  style,
}: {
  media: Media;
  folds: number;
  offset?: string;
  keys?: SequenceKey[];
  className?: string;
  style?: React.CSSProperties;
}) {
  const progress = useRef(0);
  const keyRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [loaded, setLoaded] = useState(false);

  const ref = useScrollProgress<HTMLDivElement>({
    offset,
    onProgress: (p) => {
      progress.current = p;
      keys.forEach((k, i) => {
        keyRefs.current[i]?.classList.toggle("is-active", p >= k.from && p < k.to);
      });
    },
  });

  const onLoaded = useCallback(() => setLoaded(true), []);

  return (
    <div
      ref={ref}
      className={cn("sb-seq -scroll", loaded && "-loaded", className)}
      style={{ "--sequence-height": folds, ...style } as React.CSSProperties}
    >
      <div className="sb-seq_inner">
        <div className="sb-seq_sticky">
          <div className="sb-seq_media">
            <SequenceMedia media={media} progressRef={progress} onLoaded={onLoaded} />
          </div>
          <div className="sb-seq_content">
            {keys.map((k, i) => (
              <div key={i} ref={(el) => void (keyRefs.current[i] = el)} className={cn("sb-key", k.className)}>
                {k.children}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Full-viewport autoplay hero (`c-sequence -autoplay`). The title key reveals after
 * `keyDelay` seconds of playback, and the media darkens toward navy as the page scrolls.
 */
export function HeroSequence({
  video,
  poster,
  keyDelay = 1.25,
  children,
  ui,
}: {
  video?: { landscape: string; portrait?: string };
  poster: SequenceFrame;
  keyDelay?: number;
  children: React.ReactNode;
  ui: React.ReactNode;
}) {
  const keyRef = useRef<HTMLSpanElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => keyRef.current?.classList.add("is-active"), keyDelay * 1000 + 400);
    return () => window.clearTimeout(id);
  }, [keyDelay]);

  useEffect(() => {
    return subscribeScroll(() => {
      const el = heroRef.current;
      if (!el) return;
      const p = Math.min(1, Math.max(0, window.scrollY / el.offsetHeight));
      el.style.setProperty("--progress", p.toFixed(4));
      const v = videoRef.current;
      if (v) {
        if (p >= 1 && !v.paused) v.pause();
        else if (p < 1 && v.paused && v.readyState > 1) v.play().catch(() => {});
      }
    });
  }, []);

  return (
    <div ref={heroRef} className="sb-hero">
      <div className={cn("sb-seq -autoplay", loaded && "-loaded")}>
        <div className="sb-seq_inner">
          <div className="sb-seq_sticky">
            <div className="sb-seq_media">
              {video ? (
                <video
                  ref={videoRef}
                  className="sb-seq_media_element"
                  autoPlay
                  muted
                  loop
                  playsInline
                  disablePictureInPicture
                  poster={poster.src}
                  onLoadedData={() => setLoaded(true)}
                >
                  {video.portrait && <source src={video.portrait} media="(orientation: portrait)" />}
                  <source src={video.landscape} />
                </video>
              ) : (
                <div className="sb-hero_still">
                  <Image
                    src={poster.src}
                    alt=""
                    fill
                    priority
                    sizes="100vw"
                    style={{ objectFit: "cover", objectPosition: poster.position ?? "50% 50%" }}
                    onLoad={() => setLoaded(true)}
                  />
                </div>
              )}
            </div>
            <div className="sb-seq_content">
              <div className="sb-cine -light">
                <h1 className="sb-cine_title">
                  <span ref={keyRef} className="sb-cine_key">
                    {children}
                  </span>
                </h1>
                {ui}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
