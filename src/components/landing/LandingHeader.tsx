"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { MountainMark } from "@/components/decorative/MountainMark";
import { BookTile } from "./Sections";

export type NavLink = { href: string; label: string };
export type NavProduct = { href: string; title: string; subtitle: string; image: string; imagePosition?: string };

const MENU_DURATION = 600;

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("sb-logo", className)}>
      <MountainMark className="sb-logo_mark" />
      <span className="sb-logo_word">Switchback</span>
    </span>
  );
}

function Razor() {
  return (
    <div className="sb-header_razor" aria-hidden>
      <div />
    </div>
  );
}

export function NavTile({ product, onNavigate }: { product: NavProduct; onNavigate?: () => void }) {
  return (
    <div className="sb-navtile">
      <div className="sb-navtile_head">
        <span className="sb-navtile_title">{product.title}</span>
        <span className="sb-navtile_subtitle">{product.subtitle}</span>
      </div>
      <div className="sb-navtile_image-wrapper">
        <div className="sb-navtile_image">
          <Image src={product.image} alt="" fill sizes="(min-width: 1000px) 25vw, 50vw" style={{ objectFit: "cover", objectPosition: product.imagePosition }} />
        </div>
      </div>
      <Link href={product.href} className="sb-navtile_link" onClick={onNavigate}>
        Explore {product.title}
      </Link>
    </div>
  );
}

export function LandingHeader({
  products,
  links,
  account,
}: {
  products: NavProduct[];
  links: NavLink[];
  account: { href: string; label: string };
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(false);
  const closeTimer = useRef<number>(0);

  // Hide while scrolling down, reveal on scroll up (html.has-scrolled / is-scrolling-up).
  useEffect(() => {
    const html = document.documentElement;
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      html.classList.toggle("has-scrolled", y > 80);
      if (Math.abs(y - last) > 4) html.classList.toggle("is-scrolling-up", y < last);
      last = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openMenu = useCallback(() => {
    window.clearTimeout(closeTimer.current);
    const html = document.documentElement;
    html.classList.remove("has-menu-closing");
    html.classList.add("has-menu-open");
    setOpen(true);
    requestAnimationFrame(() => setActive(true));
  }, []);

  const closeMenu = useCallback(() => {
    const html = document.documentElement;
    html.classList.add("has-menu-closing");
    setActive(false);
    closeTimer.current = window.setTimeout(() => {
      html.classList.remove("has-menu-open", "has-menu-closing");
      setOpen(false);
    }, MENU_DURATION);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeMenu();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeMenu]);

  useEffect(() => () => document.documentElement.classList.remove("has-menu-open", "has-menu-closing"), []);

  return (
    <header>
      <nav className="sb-header" aria-label="Header navigation">
        <a href="#main-content" className="sb-skip sb-button -primary">
          Skip to main content
        </a>
        <div className="sb-header_outer">
          <div className="sb-header_col sb-header_primary">
            <Razor />
            <div className="sb-header_col-bg" />
            <Link href="/" className="sb-header_logo" aria-label="Switchback home">
              <Logo />
            </Link>
            <ul className="sb-header_nav">
              {products.map((p) => (
                <li key={p.href} className="sb-header_nav-item">
                  <Link href={p.href} className="sb-header_link">
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
            <Razor />
          </div>
          <div className="sb-header_col sb-header_secondary">
            <Razor />
            <div className="sb-header_col-bg" />
            <ul className="sb-header_nav -secondary">
              <li className="sb-header_nav-item">
                <Link href={account.href} className="sb-header_link">
                  {account.label}
                </Link>
              </li>
            </ul>
            <button
              type="button"
              className="sb-button -menu -light"
              aria-label="Menu"
              aria-expanded={open}
              onClick={openMenu}
            >
              <svg width="20" height="10" viewBox="0 0 20 10" aria-hidden>
                <path d="M0 1h20M0 9h20" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
            <Razor />
          </div>
        </div>
      </nav>

      <div className="sb-menu" aria-hidden={!open} data-lenis-prevent>
        <nav className={cn("sb-menu_inner", active && "is-active")} aria-label="Main menu">
          <div className="sb-menu_head">
            <Link href="/" className="sb-menu_logo" aria-label="Switchback home" onClick={closeMenu} tabIndex={open ? 0 : -1}>
              <Logo />
            </Link>
            <button type="button" className="sb-button -menu -light" aria-label="Close" onClick={closeMenu} tabIndex={open ? 0 : -1}>
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          </div>
          <div className="sb-menu_main">
            <div className="sb-menu_main-inner">
              <ul className="sb-primary-nav">
                {links.map((l) => (
                  <li key={l.href} className="sb-primary-nav_item">
                    <Link href={l.href} className="sb-primary-nav_link" onClick={closeMenu} tabIndex={open ? 0 : -1}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <ul className="sb-primary-nav">
                <li className="sb-primary-nav_item">
                  <Link href={account.href} className="sb-primary-nav_link" onClick={closeMenu} tabIndex={open ? 0 : -1}>
                    {account.label}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="sb-menu_products">
            {products.map((p) => (
              <NavTile key={p.href} product={p} onNavigate={closeMenu} />
            ))}
          </div>
          <div className="sb-menu_cta">
            <BookTile
              className="sb-menu_cta-tile"
              href="/vehicles"
              cta="Book a ride"
              head={
                <div className="sb-book_split">
                  <span>Verified partners in Manali.</span>
                  <span>Find your ride for the mountains.</span>
                </div>
              }
            />
          </div>
        </nav>
        <div className="sb-menu_backdrop" onClick={closeMenu} />
      </div>
    </header>
  );
}
