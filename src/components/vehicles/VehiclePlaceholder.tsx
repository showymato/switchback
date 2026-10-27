import { cn } from "@/lib/utils";
import type { VehicleCategory } from "@/db/schema";

const ICONS: Record<VehicleCategory, React.ReactNode> = {
  motorcycle: (
    <path d="M5 17a2 2 0 1 0 4 0 2 2 0 1 0-4 0Zm10 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0ZM7 17h8M10 17l2-5h3l2 3M9 12l2-3h3" />
  ),
  scooter: (
    <path d="M5 17a2 2 0 1 0 4 0 2 2 0 1 0-4 0Zm10 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0ZM7 17h8l1-4h-3V9h-3l-2 4H7" />
  ),
  car: (
    <path d="M4 16h16M5 16l1.5-5a2 2 0 0 1 1.9-1.4h7.2A2 2 0 0 1 17.5 11L19 16M5 16a2 2 0 1 0 4 0m6 0a2 2 0 1 0 4 0" />
  ),
  suv: (
    <path d="M3.5 16h17M5 16l1.2-5.5A2 2 0 0 1 8.1 9h7.8a2 2 0 0 1 1.9 1.5L19 16M5 16a2 2 0 1 0 4 0m6 0a2 2 0 1 0 4 0M7 9V6h10v3" />
  ),
};

export function VehiclePlaceholder({ category, className }: { category: VehicleCategory; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-gradient-to-br from-secondary to-muted",
        className
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.1} strokeLinecap="round" strokeLinejoin="round" className="h-1/3 w-1/3 text-primary/40">
        {ICONS[category]}
      </svg>
    </div>
  );
}
