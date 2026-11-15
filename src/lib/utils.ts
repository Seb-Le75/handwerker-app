import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function createId(prefix: string) {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return `${prefix}-${uuid}`;

  // randomUUID is unavailable in Safari when the local preview is opened over
  // an unsecured LAN address. Keep the field workflow usable in that setup.
  const fallback = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${fallback}`;
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
