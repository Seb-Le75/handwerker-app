import type { Job } from "@/types";

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function scheduledDate(job: Job, today = localDateKey()) {
  // Legacy demo orders did not contain an appointment date. Open work is treated
  // as due today so it never disappears from the technician's start screen.
  return job.scheduledDate || (job.status === "Offen" ? today : job.createdAt.slice(0, 10));
}

export function scheduledTime(job: Job) {
  return job.scheduledStartTime || job.startTime || "23:59";
}

export function compareJobsByAppointment(left: Job, right: Job) {
  return `${scheduledDate(left)}T${scheduledTime(left)}`.localeCompare(
    `${scheduledDate(right)}T${scheduledTime(right)}`
  );
}

export function isOpenJob(job: Job) {
  return job.status === "Offen" || job.status === "Entwurf";
}

export function isJobOverdue(job: Job, today = localDateKey()) {
  return isOpenJob(job) && scheduledDate(job, today) < today;
}

export function jobProgressLabel(job: Job) {
  if (job.status === "Abgeschlossen") {
    return job.officeReviewedAt ? "Geprüft" : "Büroprüfung";
  }
  return job.progress ?? "Geplant";
}

export function formatAppointment(job: Job, today = localDateKey()) {
  const date = scheduledDate(job, today);
  const time = scheduledTime(job);
  const dateLabel =
    date === today
      ? "Heute"
      : new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" }).format(
          new Date(`${date}T12:00:00`)
        );
  return `${dateLabel}, ${time} Uhr`;
}
