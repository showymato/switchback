"use client";

import Image from "next/image";
import Link from "next/link";
import { useInView, useParallax, useScrollProgress } from "./scroll";
import { Logo, NavTile, type NavLink, type NavProduct } from "./LandingHeader";

export function LandingFooter({
  links,
  products,
  legal,
  background,
  marquee,
  cta,
}: {
  links: NavLink[];
  products: NavProduct[];
  legal: NavLink[];
  background: { landscape: string; portrait: string };
  marquee: string;
  cta: { href: string; label: string };
}) {
  const footerRef = useInView<HTMLElement>({
    repeat: true,
    onChange: (v) => document.documentElement.classList.toggle("has-footer-inview", v),
  });
  const bgLandscape = useParallax<HTMLDivElement>(-0.2);
  const bgPortrait = useParallax<HTMLDivElement>(-0.2);
  const posterRef = useScrollProgress<HTMLDivElement>({ offset: "0,100%" });
  const marqueeRef = useInView<HTMLDivElement>({ repeat: true });

  return (
    <footer ref={footerRef} className="sb-footer">
      <div className="sb-footer_outer">
        <div ref={bgPortrait} className="sb-footer_bg -portrait">
          <Image src={background.portrait} alt="" fill sizes="100vw" style={{ objectFit: "cover" }} />
        </div>
        <div ref={bgLandscape} className="sb-footer_bg -landscape">
          <Image src={background.landscape} alt="" fill sizes="100vw" style={{ objectFit: "cover", objectPosition: "50% 100%" }} />
        </div>
        <div className="sb-footer_inner">
          <Link href="/" className="sb-footer_logo" aria-label="Switchback home">
            <Logo />
          </Link>
          <ul className="sb-primary-nav sb-footer_nav">
            {links.map((l) => (
              <li key={l.href} className="sb-primary-nav_item">
                <Link href={l.href} className="sb-primary-nav_link">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="sb-footer_products">
            {products.map((p) => (
              <li key={p.href}>
                <div className="sb-footer_product">
                  <NavTile product={p} />
                </div>
              </li>
            ))}
          </ul>
          <div className="sb-footer_community">
            <div className="sb-footer_newsletter">
              <h2 className="sb-h6">
                Own a rental fleet in Manali?
                <br />
                Grow with Switchback.
              </h2>
              <Link href="/partner" className="sb-button -light -full">
                List your fleet
              </Link>
            </div>
            <ul className="sb-footer_socials">
              <li>
                <Link href="/contact" aria-label="Contact" className="sb-icon-button">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M3 7l9 6 9-6" />
                  </svg>
                </Link>
              </li>
              <li>
                <Link href="/help" aria-label="Help centre" className="sb-icon-button">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14M12 17h.01" />
                  </svg>
                </Link>
              </li>
              <li>
                <Link href="/safety" aria-label="Safety" className="sb-icon-button">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                    <path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z" />
                  </svg>
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="sb-footer_legal">
          <ul className="sb-footer_legal-nav">
            {legal.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="sb-footer_legal-link">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="sb-footer_legal-text">© {new Date().getFullYear()} Switchback. All rights reserved.</p>
        </div>
      </div>
      <div ref={posterRef} className="sb-footer_poster">
        <div className="sb-footer_poster-sticky-area">
          <div className="sb-footer_poster-sticky">
            <div className="sb-footer_poster-content">
              <div ref={marqueeRef} className="sb-footer_marquee" aria-hidden>
                <span>{marquee}</span>
                <span>{marquee}</span>
              </div>
              <Link href={cta.href} className="sb-button -large -secondary sb-footer_poster-cta">
                {cta.label}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
