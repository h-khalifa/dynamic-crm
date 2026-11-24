import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function formatDate(d: Date | string | null | undefined) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function toDateInput(d: Date | null | undefined) {
  return d ? new Date(d).toISOString().slice(0, 10) : "";
}

export function contactName(c: { firstName: string; lastName: string }) {
  return `${c.firstName} ${c.lastName}`.trim();
}

/** Result shape for server actions used with useActionState. */
export type ActionState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string>; message?: string };
