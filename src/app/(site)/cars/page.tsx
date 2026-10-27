import type { Metadata } from "next";
import { VehicleResultsPage, type SearchParams } from "@/components/vehicles/VehicleResultsPage";

export const metadata: Metadata = {
  title: "Self-drive car rentals in Manali",
  description: "Browse verified self-drive car rentals in Manali with transparent pricing and refundable deposits.",
};

export default function CarsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <VehicleResultsPage searchParams={searchParams} forcedCategory="car" title="Self-drive car rentals in Manali" formAction="/cars" />
  );
}
