"use client";

import Image from "next/image";
import { useRef } from "react";
import { ease, useScrollProgress } from "./scroll";

export type ViewfinderTile = { src: string; position?: string };

/**
 * "Viewfinder" section: the dust panel opens to full width, the title words rise out of
 * their masks as you scroll, and a ring of photo tiles turns and scales around them.
 * On touch devices the ring spins continuously instead (CSS).
 */
export function Viewfinder({
  tag,
  intro,
  title,
  tiles,
}: {
  tag: string;
  intro: string;
  title: { mobile: string[]; desktop: string; words: string[]; emphasis: string };
  tiles: ViewfinderTile[];
}) {
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const sectionRef = useScrollProgress<HTMLDivElement>();

  // GSAP-equivalent timeline: each word tweens y 100% → 0 over 0.5 with a 0.2 stagger.
  const titleRef = useScrollProgress<HTMLHeadingElement>({
    offset: "0,50%",
    onProgress: (p) => {
      const els = wordRefs.current.filter(Boolean) as HTMLSpanElement[];
      const visible = els.filter((el) => el.offsetParent !== null);
      const total = 0.5 + 0.2 * Math.max(0, visible.length - 1);
      visible.forEach((el, i) => {
        const local = Math.min(1, Math.max(0, (p * total - i * 0.2) / 0.5));
        el.style.transform = `translate3d(0, ${((1 - ease.power4Out(local)) * 100).toFixed(2)}%, 0)`;
      });
    },
  });

  let w = 0;
  const word = (text: string, className = "", mobileOnly = false, desktopOnly = false) => {
    const i = w++;
    return (
      <span
        className={`sb-vf_line${mobileOnly ? " sb-only-mobile" : ""}${desktopOnly ? " sb-only-desktop" : ""}`}
        key={`${text}-${i}`}
      >
        <span className={`sb-vf_word ${className}`}>
          <span ref={(el) => void (wordRefs.current[i] = el)}>{text}</span>
        </span>
      </span>
    );
  };

  const n = tiles.length;

  return (
    <div ref={sectionRef} className="sb-vf sb-dust">
      <div className="sb-vf_intro">
        <div className="sb-technical-tag">{tag}</div>
        <p className="sb-body">{intro}</p>
      </div>
      <div className="sb-vf_title-wrapper">
        <h2 ref={titleRef} className="sb-vf_title" aria-label={`${title.desktop} ${title.words.join(" ")} ${title.emphasis}`}>
          {title.mobile.map((t, i) => (i === 0 ? (
            <span className="sb-vf_line sb-only-mobile" key={`m${i}`} aria-hidden>
              <span className="sb-vf_word"><span>{t}</span></span>
            </span>
          ) : word(t, "", true)))}
          <span className="sb-vf_line sb-only-desktop" aria-hidden>
            <span className="sb-vf_word"><span>{title.desktop}</span></span>
          </span>
          {title.words.map((t) => word(t))}
          {word(title.emphasis, "sb-vf_em")}
        </h2>
        <svg className="sb-vf_crop -tl" viewBox="0 0 40 40" aria-hidden><path d="M1 40V5a4 4 0 0 1 4-4h35" /></svg>
        <svg className="sb-vf_crop -br" viewBox="0 0 40 40" aria-hidden><path d="M39 0v35a4 4 0 0 1-4 4H0" /></svg>
      </div>
      <div
        className="sb-vf_revolver"
        style={{ "--revolver-size": 0.26736, "--revolver-angle": `${360 / n}deg` } as React.CSSProperties}
        aria-hidden
      >
        <div className="sb-vf_tiles">
          {tiles.map((tile, i) => (
            <div key={i} className="sb-vf_tile-wrapper" style={{ "--revolver-index": i } as React.CSSProperties}>
              <div className="sb-vf_tile">
                {String(i + 1).padStart(2, "0")}
                <div className="sb-vf_image">
                  <Image
                    src={tile.src}
                    alt=""
                    fill
                    sizes="(max-width: 1000px) 18vw, 10vw"
                    style={{ objectFit: "cover", objectPosition: tile.position ?? "50% 50%" }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
