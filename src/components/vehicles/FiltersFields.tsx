import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export interface FiltersDefaults {
  category?: string;
  startsAt?: string;
  endsAt?: string;
  minPrice?: string;
  maxPrice?: string;
  transmission?: string;
  minSeats?: string;
  sort?: string;
}

export function FiltersFields({ defaults }: { defaults: FiltersDefaults }) {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="f-category">Category</Label>
        <select id="f-category" name="category" defaultValue={defaults.category ?? ""} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
          <option value="">Any category</option>
          <option value="motorcycle">Motorcycle</option>
          <option value="scooter">Scooter</option>
          <option value="car">Self-drive car</option>
          <option value="suv">Self-drive SUV</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="f-startsAt">Pickup</Label>
        <input id="f-startsAt" name="startsAt" type="datetime-local" defaultValue={defaults.startsAt} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="f-endsAt">Return</Label>
        <input id="f-endsAt" name="endsAt" type="datetime-local" defaultValue={defaults.endsAt} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="f-minPrice">Min &#8377;/day</Label>
          <input id="f-minPrice" name="minPrice" type="number" min={0} step={100} defaultValue={defaults.minPrice} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="f-maxPrice">Max &#8377;/day</Label>
          <input id="f-maxPrice" name="maxPrice" type="number" min={0} step={100} defaultValue={defaults.maxPrice} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="f-transmission">Transmission</Label>
        <select id="f-transmission" name="transmission" defaultValue={defaults.transmission ?? ""} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
          <option value="">Any</option>
          <option value="manual">Manual</option>
          <option value="automatic">Automatic</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="f-minSeats">Minimum seats</Label>
        <select id="f-minSeats" name="minSeats" defaultValue={defaults.minSeats ?? ""} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
          <option value="">Any</option>
          <option value="2">2+</option>
          <option value="4">4+</option>
          <option value="5">5+</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="f-sort">Sort by</Label>
        <select id="f-sort" name="sort" defaultValue={defaults.sort ?? "relevance"} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
          <option value="relevance">Relevance</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          Apply filters
        </Button>
        <Button render={<Link href="/vehicles" />} nativeButton={false} variant="outline" type="button">
          Clear
        </Button>
      </div>
    </div>
  );
}
