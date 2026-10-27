"use client";

import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function FiltersSheet({ children }: { children: React.ReactNode }) {
  return (
    <div className="lg:hidden">
      <Sheet>
        <SheetTrigger render={<Button variant="outline" className="w-full" />}>
          <SlidersHorizontal className="mr-2 h-4 w-4" /> Filters
        </SheetTrigger>
        <SheetContent side="left" className="w-80 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filter vehicles</SheetTitle>
          </SheetHeader>
          <form action="/vehicles" method="GET" className="px-4 pb-6">
            {children}
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
