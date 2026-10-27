import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { titleCase } from "@/lib/format";
import { Reveal } from "@/components/motion/Reveal";

/**
 * Building blocks shared by the customer, partner and admin portals. They carry the
 * landing page's language into the app: mono "technical" labels, wide display numbers,
 * notched hairlines, white cards on a warm dust background, and orange as the signal colour.
 */

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  status,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  status?: string;
}) {
  return (
    <Reveal className="mb-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-[clamp(1.75rem,1.4rem+1.5vw,2.75rem)] leading-[1.02] text-foreground">{title}</h1>
            {status && <StatusBadge status={status} size="lg" />}
          </div>
          {description && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <NotchRule className="mt-6" />
    </Reveal>
  );
}

/** Orange bracketed mono label, e.g. `[ PARTNER ]`. */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("technical-label inline-flex items-center gap-1 text-orange", className)}>
      <span aria-hidden>[</span>
      {children}
      <span aria-hidden>]</span>
    </span>
  );
}

/** Hairline with the rounded "tab" ends used across the landing page. */
export function NotchRule({ className }: { className?: string }) {
  return <div aria-hidden className={cn("h-[9px] rounded-t-[4px] border border-b-0 border-foreground/15", className)} />;
}

export function StatGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-2 gap-1 lg:grid-cols-4", className)}>{children}</div>;
}

export function StatCard({
  label,
  value,
  hint,
  index,
  tone = "default",
  href,
  delay = 0,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  index?: number;
  tone?: "default" | "navy" | "orange";
  href?: string;
  delay?: number;
}) {
  const body = (
    <div
      className={cn(
        "group relative flex h-full min-h-[148px] flex-col justify-between overflow-hidden rounded-[4px] p-4 transition-colors",
        tone === "default" && "bg-card text-foreground",
        tone === "navy" && "bg-navy text-white",
        tone === "orange" && "bg-orange grain text-white",
        href && tone === "default" && "hover:bg-[#fbfaf9]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={cn("technical-label", tone === "default" ? "text-muted-foreground" : "text-white/70")}>{label}</span>
        {index !== undefined && (
          <span className={cn("technical-label", tone === "default" ? "text-orange" : "text-white/60")}>
            {String(index).padStart(2, "0")}
          </span>
        )}
      </div>
      <div>
        <div className="font-heading text-[clamp(1.6rem,1.3rem+1.2vw,2.4rem)] leading-none tabular-nums">{value}</div>
        {hint && <div className={cn("mt-2 text-xs", tone === "default" ? "text-muted-foreground" : "text-white/70")}>{hint}</div>}
      </div>
      {href && (
        <ArrowUpRight
          className={cn(
            "absolute bottom-4 right-4 size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
            tone === "default" ? "text-foreground/40" : "text-white/70"
          )}
        />
      )}
    </div>
  );

  return (
    <Reveal delay={delay} className="h-full">
      {href ? (
        <Link href={href} className="block h-full">
          {body}
        </Link>
      ) : (
        body
      )}
    </Reveal>
  );
}

export function Panel({
  title,
  eyebrow,
  action,
  children,
  className,
  bodyClassName,
  delay = 0,
}: {
  title?: React.ReactNode;
  eyebrow?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  delay?: number;
}) {
  return (
    <Reveal delay={delay} className={cn("rounded-[4px] bg-card", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            {eyebrow && <div className="technical-label mb-1 text-muted-foreground">{eyebrow}</div>}
            {title && <h2 className="text-[0.95rem] font-medium text-foreground">{title}</h2>}
          </div>
          {action}
        </div>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </Reveal>
  );
}

/** Text link styled as a mono "View all ↗" action. */
export function PanelLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="technical-label group inline-flex items-center gap-1 text-foreground/70 transition-colors hover:text-orange">
      {children}
      <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </Link>
  );
}

/** A list row inside a Panel (or standalone list); becomes a link when `href` is set. */
export function Row({
  href,
  title,
  meta,
  aside,
  leading,
  className,
}: {
  href?: string;
  title: React.ReactNode;
  meta?: React.ReactNode;
  aside?: React.ReactNode;
  leading?: React.ReactNode;
  className?: string;
}) {
  const inner = (
    <>
      {leading}
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-foreground">{title}</div>
        {meta && <div className="mt-0.5 text-[0.8rem] text-muted-foreground">{meta}</div>}
      </div>
      {aside && <div className="flex shrink-0 flex-col items-end gap-1.5 text-right">{aside}</div>}
      {href && (
        <ArrowUpRight className="size-4 shrink-0 text-foreground/30 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-orange" />
      )}
    </>
  );
  const cls = cn(
    "group relative flex items-center gap-4 border-b border-border px-5 py-4 text-sm last:border-b-0",
    href && "transition-colors hover:bg-[#faf9f8]",
    className
  );
  return href ? (
    <Link href={href} className={cls}>
      <span aria-hidden className="absolute inset-y-3 left-0 w-[3px] origin-center scale-y-0 rounded-r bg-orange transition-transform duration-300 group-hover:scale-y-100" />
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

/** White card that holds Rows. */
export function RowList({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <Reveal delay={delay} className={cn("overflow-hidden rounded-[4px] bg-card", className)}>
      {children}
    </Reveal>
  );
}

export function EmptyState({
  title,
  body,
  action,
  className,
}: {
  title: string;
  body?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <Reveal
      className={cn(
        "flex flex-col items-center justify-center rounded-[4px] border border-dashed border-foreground/15 bg-card/60 px-6 py-14 text-center",
        className
      )}
    >
      <span aria-hidden className="mb-4 flex size-10 items-center justify-center rounded-full bg-dust text-orange">
        <svg viewBox="0 0 48 36" fill="none" className="h-4 w-6">
          <path d="M1 32 L13 11 L19 20 L24 13 L34 29M24 32 L34 15 L47 32M1 32.5 H47" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      </span>
      <p className="font-medium text-foreground">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </Reveal>
  );
}

/** Label/value grid used on detail pages. */
export function DetailGrid({ items, columns = 2 }: { items: { label: string; value: React.ReactNode }[]; columns?: 2 | 3 }) {
  return (
    <dl className={cn("grid gap-x-6 gap-y-5", columns === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2")}>
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="technical-label text-muted-foreground">{item.label}</dt>
          <dd className="mt-1.5 break-words text-sm font-medium text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Key/value line used for money breakdowns. */
export function Line({ label, value, strong }: { label: React.ReactNode; value: React.ReactNode; strong?: boolean }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4 py-1.5 text-sm", strong && "text-base")}>
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("tabular-nums text-foreground", strong ? "font-heading text-lg" : "font-medium")}>{value}</span>
    </div>
  );
}

const STATUS_TONES: Record<string, "ok" | "pending" | "danger" | "active"> = {
  confirmed: "ok",
  approved: "ok",
  published: "ok",
  completed: "ok",
  processed: "ok",
  resolved: "ok",
  paid: "ok",
  captured: "ok",
  succeeded: "ok",
  closed: "ok",
  active: "active",
  pickup_in_progress: "active",
  return_in_progress: "active",
  in_progress: "active",
  submitted: "pending",
  under_review: "pending",
  pending: "pending",
  pending_checkout: "pending",
  awaiting_payment: "pending",
  pending_partner_confirmation: "pending",
  requested: "pending",
  open: "pending",
  draft: "pending",
  created: "pending",
  rejected: "danger",
  cancelled: "danger",
  expired: "danger",
  failed: "danger",
  payment_failed: "danger",
  suspended: "danger",
  disputed: "danger",
};

/** Status chip with a tone derived from the status value (green / orange / red / navy). */
export function StatusBadge({ status, size = "sm", className }: { status: string; size?: "sm" | "lg"; className?: string }) {
  const tone = STATUS_TONES[status];
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[2px] font-mono font-medium uppercase tracking-[0.02em]",
        size === "sm" ? "h-5 px-1.5 text-[0.625rem]" : "h-7 px-2.5 text-[0.7rem]",
        tone === "ok" && "bg-success-soft text-success",
        tone === "pending" && "bg-warning-soft text-warning",
        tone === "danger" && "bg-danger-soft text-destructive",
        tone === "active" && "bg-navy text-white",
        !tone && "bg-secondary text-secondary-foreground",
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full bg-current",
          (tone === "active" || tone === "pending") && "animate-pulse"
        )}
      />
      {titleCase(status)}
    </span>
  );
}

/** Callout used for account-level notices (partner review state, etc.). */
export function Notice({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "warning" | "danger";
  title: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <Reveal
      className={cn(
        "mb-6 flex gap-4 rounded-[4px] border-l-[3px] bg-card px-5 py-4 text-sm",
        tone === "info" && "border-navy",
        tone === "warning" && "border-orange",
        tone === "danger" && "border-destructive"
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 font-medium text-foreground">{title}</div>
        {children && <div className="mt-1 text-muted-foreground">{children}</div>}
      </div>
    </Reveal>
  );
}
