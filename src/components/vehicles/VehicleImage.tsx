import { VehiclePlaceholder } from "./VehiclePlaceholder";
import type { VehicleCategory } from "@/db/schema";

// No `fileKey` means no real partner-supplied photo exists yet — show an honest
// illustrated placeholder instead of a stock photo that would misrepresent the vehicle.
export function VehicleImage({
  fileKey,
  category,
  className,
}: {
  fileKey?: string | null;
  category: VehicleCategory;
  className?: string;
}) {
  if (fileKey) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={fileKey} alt="" className={className} />;
  }
  return <VehiclePlaceholder category={category} className={className} />;
}
