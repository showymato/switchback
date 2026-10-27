import { FiltersFields } from "./FiltersFields";
import { FiltersSheet } from "./FiltersSheet";
import { VehicleCard } from "./VehicleCard";
import { searchVehicles } from "@/server/queries/vehicles";
import type { VehicleCategory } from "@/db/schema";

export type SearchParams = Record<string, string | string[] | undefined>;

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// <input type="datetime-local"> values are IST wall-clock strings with no offset —
// interpret them as Asia/Kolkata (+05:30), matching src/server/actions/booking.ts.
function parseIst(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}:00+05:30`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function VehicleResultsPage({
  searchParams,
  forcedCategory,
  title,
  formAction = "/vehicles",
}: {
  searchParams: Promise<SearchParams>;
  forcedCategory?: VehicleCategory;
  title: string;
  formAction?: string;
}) {
  const sp = await searchParams;
  const category = forcedCategory ?? one(sp.category);
  const startsAtRaw = one(sp.startsAt);
  const endsAtRaw = one(sp.endsAt);
  const minPrice = one(sp.minPrice);
  const maxPrice = one(sp.maxPrice);
  const transmission = one(sp.transmission);
  const minSeats = one(sp.minSeats);
  const sort = one(sp.sort);

  const startsAt = parseIst(startsAtRaw);
  const endsAt = parseIst(endsAtRaw);
  const dateRangeInvalid = Boolean(startsAt && endsAt && endsAt.getTime() <= startsAt.getTime());

  const results = dateRangeInvalid
    ? []
    : await searchVehicles({
        category: (category as VehicleCategory) || undefined,
        startsAt,
        endsAt,
        minPricePaise: minPrice ? Number(minPrice) * 100 : undefined,
        maxPricePaise: maxPrice ? Number(maxPrice) * 100 : undefined,
        transmission: transmission === "manual" || transmission === "automatic" ? transmission : undefined,
        minSeats: minSeats ? Number(minSeats) : undefined,
        sort: sort === "price_asc" || sort === "price_desc" ? sort : "relevance",
      });

  const defaults = {
    category: forcedCategory ? undefined : category,
    startsAt: startsAtRaw,
    endsAt: endsAtRaw,
    minPrice,
    maxPrice,
    transmission,
    minSeats,
    sort,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-heading text-3xl text-foreground">{title}</h1>
        <FiltersSheet>
          <input type="hidden" name="category" value={forcedCategory ?? ""} />
          <FiltersFields defaults={defaults} />
        </FiltersSheet>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <form action={formAction} method="GET" className="sticky top-24 rounded-sm border border-border bg-card p-5">
            {forcedCategory && <input type="hidden" name="category" value={forcedCategory} />}
            <FiltersFields defaults={defaults} />
          </form>
        </aside>

        <div>
          {dateRangeInvalid && (
            <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Return time must be after pickup time.
            </p>
          )}

          {results.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-12 text-center">
              <p className="font-heading text-lg text-foreground">No vehicles match these filters</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Try widening your dates or price range, or clear filters to see everything available.
              </p>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-muted-foreground">
                {results.length} vehicle{results.length === 1 ? "" : "s"} available
              </p>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {results.map((item) => (
                  <VehicleCard key={item.vehicle.id} data={{ ...item, images: item.images.map((i) => ({ fileKey: i.fileKey })) }} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
