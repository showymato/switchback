export { formatPaise } from "@/server/services/pricing";

const IST_TZ = "Asia/Kolkata";

export function formatDateTimeIst(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatDateIst(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function toDatetimeInputValue(date: Date): string {
  // "YYYY-MM-DDTHH:mm" in IST, for <input type="datetime-local"> defaults.
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: IST_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

// Words that should stay fully capitalized rather than Title Cased (e.g. "suv" -> "SUV").
const ACRONYMS = new Set(["suv", "abs", "id", "gst", "pan", "gstin"]);

export function titleCase(value: string): string {
  return value
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => (ACRONYMS.has(word.toLowerCase()) ? word.toUpperCase() : word.replace(/\b\w/g, (c) => c.toUpperCase())))
    .join(" ");
}
