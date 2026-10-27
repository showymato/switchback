"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createVehicleAction } from "@/server/actions/partner";
import type { ActionResult } from "@/server/actions/auth";

const initialState: ActionResult | null = null;

export function NewVehicleForm({ pickupLocations }: { pickupLocations: { id: string; name: string; area: string }[] }) {
  const [state, formAction, pending] = useActionState(createVehicleAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state && !state.ok && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="category">Category</Label>
          <select id="category" name="category" required className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="motorcycle">Motorcycle</option>
            <option value="scooter">Scooter</option>
            <option value="car">Car</option>
            <option value="suv">SUV</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pickupLocationId">Pickup location</Label>
          <select id="pickupLocationId" name="pickupLocationId" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" disabled={pickupLocations.length === 0}>
            {pickupLocations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.area})
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="make">Make</Label>
          <Input id="make" name="make" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="model">Model</Label>
          <Input id="model" name="model" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="year">Year</Label>
          <Input id="year" name="year" type="number" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="registrationNumber">Registration number</Label>
          <Input id="registrationNumber" name="registrationNumber" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="transmission">Transmission</Label>
          <select id="transmission" name="transmission" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">—</option>
            <option value="manual">Manual</option>
            <option value="automatic">Automatic</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fuelType">Fuel type</Label>
          <select id="fuelType" name="fuelType" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">—</option>
            <option value="petrol">Petrol</option>
            <option value="diesel">Diesel</option>
            <option value="electric">Electric</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="seatingCapacity">Seating capacity</Label>
          <Input id="seatingCapacity" name="seatingCapacity" type="number" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="engineCc">Engine cc</Label>
          <Input id="engineCc" name="engineCc" type="number" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="dailyRatePaise">Daily rate (&#8377;)</Label>
          <Input id="dailyRatePaise" name="dailyRatePaise" type="number" required onWheel={(e) => e.currentTarget.blur()} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hourlyRatePaise">Hourly rate (&#8377;, optional)</Label>
          <Input id="hourlyRatePaise" name="hourlyRatePaise" type="number" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="securityDepositPaise">Deposit (&#8377;)</Label>
          <Input id="securityDepositPaise" name="securityDepositPaise" type="number" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="includedKmPerDay">Included km/day</Label>
          <Input id="includedKmPerDay" name="includedKmPerDay" type="number" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="extraKmRatePaise">Extra km rate (&#8377;)</Label>
          <Input id="extraKmRatePaise" name="extraKmRatePaise" type="number" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="deliveryChargePaise">Delivery charge (&#8377;)</Label>
          <Input id="deliveryChargePaise" name="deliveryChargePaise" type="number" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="minRentalHours">Minimum rental (hours)</Label>
        <Input id="minRentalHours" name="minRentalHours" type="number" defaultValue={24} required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={3} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="features">Features (comma separated)</Label>
        <Input id="features" name="features" placeholder="ABS, Bluetooth audio, Hill-hold" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="eligibilityRequirements">Driver eligibility requirements (comma separated)</Label>
        <Input id="eligibilityRequirements" name="eligibilityRequirements" placeholder="Valid licence held 1+ year, Minimum age 21" />
      </div>

      <p className="text-xs text-muted-foreground">
        Note: amounts entered here are in whole rupees in this form for simplicity of data entry; they are stored
        in paise. Document upload (RC, insurance, permit) is a follow-up step requested by an admin reviewer.
      </p>

      <Button type="submit" disabled={pending}>
        {pending ? "Submitting..." : "Submit for review"}
      </Button>
    </form>
  );
}
