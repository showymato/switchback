import type { Metadata } from "next";
import { VehicleResultsPage, type SearchParams } from "@/components/vehicles/VehicleResultsPage";

export const metadata: Metadata = {
  title: "Motorcycle rentals in Manali",
  description: "Browse verified motorcycle rentals in Manali with transparent pricing and refundable deposits.",
};

export default function MotorcyclesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <VehicleResultsPage
      searchParams={searchParams}
      forcedCategory="motorcycle"
      title="Motorcycle rentals in Manali"
      formAction="/motorcycles"
    />
  );
}
