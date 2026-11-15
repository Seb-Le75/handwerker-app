import type { JobDraft } from "@/types";

const travelCategoryCosts = { "1": 15, "2": 25, "3": 35 } as const;

export function calculateJobTotal(draft: JobDraft) {
  const materials = (draft.materials ?? []).reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const tools = (draft.tools ?? []).reduce((sum, line) => sum + line.quantity * line.costRate, 0);
  const maintenance = (draft.maintenanceChecks ?? []).reduce(
    (sum, check) => sum + (check.flatRate ?? 0) + (check.travelFlatRate ?? 0),
    0
  );
  const travel = draft.travelCostCategory ? travelCategoryCosts[draft.travelCostCategory] : 0;
  return roundCurrency(materials + tools + maintenance + travel);
}

export function calculateDiscountedTotal(total: number, discountPercent: number) {
  return roundCurrency(total * (1 - Math.max(0, Math.min(100, discountPercent)) / 100));
}

export function paypalMeUrl(paypalMe: string, amount: number) {
  const value = paypalMe.trim();
  if (!value) return "";
  const base = value.startsWith("http://") || value.startsWith("https://") ? value : `https://paypal.me/${value}`;
  return `${base.replace(/\/$/, "")}/${amount.toFixed(2)}EUR`;
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
