export function startOfWeek(dateKey: string) {
  const date = parseLocalDate(dateKey);
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  return toLocalDateKey(date);
}

export function addCalendarDays(dateKey: string, days: number) {
  const date = parseLocalDate(dateKey);
  date.setDate(date.getDate() + days);
  return toLocalDateKey(date);
}

export function weekDateKeys(weekStart: string) {
  return Array.from({ length: 7 }, (_, index) => addCalendarDays(weekStart, index));
}

export function formatPlanningDay(dateKey: string) {
  return new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" }).format(
    parseLocalDate(dateKey)
  );
}

export function formatPlanningWeek(weekStart: string) {
  const end = addCalendarDays(weekStart, 6);
  const format = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  return `${format.format(parseLocalDate(weekStart))} – ${format.format(parseLocalDate(end))}`;
}

function parseLocalDate(dateKey: string) {
  return new Date(`${dateKey}T12:00:00`);
}

function toLocalDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
