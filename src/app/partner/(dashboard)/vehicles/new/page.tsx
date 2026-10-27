import { requireRole } from "@/lib/auth";
import { getPartnerForOwner, listPartnerPickupLocations } from "@/server/queries/partners";
import { NewVehicleForm } from "@/components/partner/NewVehicleForm";
import { NewPickupLocationForm } from "@/components/partner/NewPickupLocationForm";
import { PageHeader, Panel } from "@/components/dashboard/ui";

export default async function NewVehiclePage() {
  const user = await requireRole("partner_owner", "partner_staff");
  const partner = await getPartnerForOwner(user.id);
  if (!partner) return null;

  const locations = await listPartnerPickupLocations(partner.id);

  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow="Fleet"
        title="Add a vehicle"
        description='New vehicles start as "submitted" and are reviewed by an admin before they can be published.'
      />

      <div className="space-y-1">
        {locations.length === 0 && (
          <Panel title="Add a pickup location first" eyebrow="Step 1">
            <NewPickupLocationForm />
          </Panel>
        )}

        <Panel title="Vehicle details" eyebrow={locations.length === 0 ? "Step 2" : "Listing"} delay={0.05}>
          <NewVehicleForm pickupLocations={locations.map((l) => ({ id: l.id, name: l.name, area: l.area }))} />
        </Panel>
      </div>
    </div>
  );
}
