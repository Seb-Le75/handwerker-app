import type { MaterialUnit } from "@/types";

export const materialUnits: MaterialUnit[] = ["Stück", "m", "cm", "m²", "m³", "ml", "l", "kg", "g", "Pauschal"];

export function normalizeMaterialUnit(value: unknown): MaterialUnit {
  if (value === "Länge") return "m";
  if (value === "Menge") return "l";
  return materialUnits.includes(value as MaterialUnit) ? (value as MaterialUnit) : "Stück";
}
