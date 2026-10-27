import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const CATEGORIES = [
  { value: "", label: "Any category" },
  { value: "motorcycle", label: "Motorcycle" },
  { value: "scooter", label: "Scooter" },
  { value: "car", label: "Self-drive car" },
  { value: "suv", label: "Self-drive SUV" },
];

// A plain GET form — works with JS disabled, and keeps search state entirely in the
// URL so results are shareable/bookmarkable and the filters survive a page refresh.
export function SearchWidget() {
  return (
    <form
      action="/vehicles"
      method="GET"
      className="rounded-sm border border-border/60 bg-card/95 p-5 shadow-[0_24px_60px_-20px_rgba(16,42,32,0.35)] backdrop-blur-sm sm:p-6"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="category" className="text-xs uppercase tracking-wide text-muted-foreground">
            Category
          </Label>
          <select
            id="category"
            name="category"
            defaultValue=""
            className="h-10 w-full rounded-sm border border-input bg-background px-3 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="startsAt" className="text-xs uppercase tracking-wide text-muted-foreground">
            Pickup
          </Label>
          <input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            required
            className="h-10 w-full rounded-sm border border-input bg-background px-3 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endsAt" className="text-xs uppercase tracking-wide text-muted-foreground">
            Return
          </Label>
          <input
            id="endsAt"
            name="endsAt"
            type="datetime-local"
            required
            className="h-10 w-full rounded-sm border border-input bg-background px-3 text-sm"
          />
        </div>
        <Button type="submit" size="lg" className="h-10 bg-primary text-primary-foreground hover:bg-primary/90">
          Search vehicles
        </Button>
      </div>
    </form>
  );
}
