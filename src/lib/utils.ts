import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function formatCustomerName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

// Formatiert die Adresse eines Kunden aus strukturierten Feldern oder freundlicherweise aus dem alten Free-Text-Feld
export function formatAddress(customer?: { address?: string; street?: string; houseNumber?: string; postalCode?: string; city?: string }) {
  if (!customer) return "";
  const { street, houseNumber, postalCode, city, address } = customer;
  if (street || houseNumber || postalCode || city) {
    const parts = [] as string[];
    if (street) parts.push(`${street}${houseNumber ? ` ${houseNumber}` : ""}`.trim());
    const cityPart = `${postalCode ? `${postalCode} ` : ""}${city ?? ""}`.trim();
    if (cityPart) parts.push(cityPart);
    return parts.join(", ");
  }
  return address ?? "";
}
