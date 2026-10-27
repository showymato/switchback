export function MountainMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 36" fill="none" className={className} aria-hidden>
      <path
        d="M1 32 L13 11 L19 20 L24 13 L34 29"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M24 32 L34 15 L47 32"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx="40" cy="7" r="3.2" stroke="currentColor" strokeWidth="2" />
      <path d="M1 32.5 H47" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
