import type { Metadata } from "next";
import { VehicleResultsPage, type SearchParams } from "@/components/vehicles/VehicleResultsPage";

export const metadata: Metadata = {
  title: "Scooter rentals in Manali",
  description: "Browse verified scooter rentals in Manali with transparent pricing and refundable deposits.",
};

export default function ScootersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <VehicleResultsPage searchParams={searchParams} forcedCategory="scooter" title="Scooter rentals in Manali" formAction="/scooters" />
  );
}
