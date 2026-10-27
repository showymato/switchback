import type { Metadata } from "next";
import { VehicleResultsPage, type SearchParams } from "@/components/vehicles/VehicleResultsPage";

export const metadata: Metadata = {
  title: "Self-drive SUV rentals in Manali",
  description: "Browse verified self-drive SUV rentals in Manali with transparent pricing and refundable deposits.",
};

export default function SuvsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <VehicleResultsPage searchParams={searchParams} forcedCategory="suv" title="Self-drive SUV rentals in Manali" formAction="/suvs" />
  );
}
