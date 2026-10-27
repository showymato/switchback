import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  {
    href: "/motorcycles",
    label: "Motorcycles",
    copy: "Himalayan-ready machines built for mountain passes.",
    tone: "bg-[#102A20] text-[#f7f4ec]",
    span: "sm:col-span-3 sm:row-span-2",
    aspect: "aspect-[4/3] sm:aspect-auto sm:h-full",
  },
  {
    href: "/scooters",
    label: "Scooters",
    copy: "Easy, automatic rides for the valley and old town.",
    tone: "bg-[#ece8dc] text-[#211f1b]",
    span: "sm:col-span-3",
    aspect: "aspect-[16/9]",
  },
  {
    href: "/cars",
    label: "Self-drive cars",
    copy: "Comfortable hatchbacks for day trips with the family.",
    tone: "bg-[#c65a3d] text-white",
    span: "sm:col-span-3",
    aspect: "aspect-[16/9]",
  },
  {
    href: "/suvs",
    label: "Self-drive SUVs",
    copy: "4x4 capability for higher, rougher roads.",
    tone: "bg-[#A8B39B] text-[#1c261b]",
    span: "sm:col-span-3",
    aspect: "aspect-[16/9]",
  },
];

export function CategoryShowcase() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
      {CATEGORIES.map((c) => (
        <Link
          key={c.href}
          href={c.href}
          className={cn(
            "group relative flex flex-col justify-end overflow-hidden rounded-sm p-6 transition-transform duration-500 ease-out hover:-translate-y-1",
            c.tone,
            c.span,
            c.aspect
          )}
        >
          <ArrowUpRight className="absolute right-5 top-5 h-5 w-5 opacity-60 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:opacity-100" />
          <h3 className="font-heading text-2xl sm:text-3xl">{c.label}</h3>
          <p className="mt-2 max-w-xs text-sm opacity-80">{c.copy}</p>
        </Link>
      ))}
    </div>
  );
}
