import type { Metadata } from "next";
import { VehicleResultsPage, type SearchParams } from "@/components/vehicles/VehicleResultsPage";

export const metadata: Metadata = { title: "Browse vehicles" };

export default function VehiclesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <VehicleResultsPage searchParams={searchParams} title="Browse vehicles" />;
}
