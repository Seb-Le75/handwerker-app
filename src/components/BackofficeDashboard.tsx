"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  ClipboardPlus,
  Clock3,
  UsersRound
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mockCustomers, mockJobs } from "@/data/mock";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  compareJobsByAppointment,
  formatAppointment,
  isJobOverdue,
  jobProgressLabel,
  localDateKey,
  scheduledDate,
  scheduledTime
} from "@/lib/jobs";
import { formatCustomerName } from "@/lib/utils";
import type { Customer, Job } from "@/types";

type OfficeFilter = "today" | "open" | "review" | "completed";

export function BackofficeDashboard() {
  const [customers] = useLocalStorage<Customer[]>("hsa-customers", mockCustomers);
  const [jobs, setJobs] = useLocalStorage<Job[]>("hsa-jobs", mockJobs);
  const [filter, setFilter] = useState<OfficeFilter>("today");
  const today = localDateKey();
  const openJobs = jobs.filter((job) => job.status === "Offen");
  const todaysJobs = openJobs.filter((job) => scheduledDate(job, today) === today);
  const reviewJobs = jobs.filter((job) => job.status === "Abgeschlossen" && !job.officeReviewedAt);
  const completedJobs = jobs.filter((job) => job.status === "Abgeschlossen" && job.officeReviewedAt);
  const problemJobs = jobs.filter(
    (job) =>
      isJobOverdue(job, today) ||
      job.acceptance.repairNotPossible === true ||
      (job.status === "Offen" && !job.assignedTechnician)
  );

  const selectedJobs =
    filter === "today" ? todaysJobs : filter === "open" ? openJobs : filter === "review" ? reviewJobs : completedJobs;
  const visibleJobs = [...selectedJobs].sort(compareJobsByAppointment);

  function markReviewed(jobId: string) {
    setJobs(
      jobs.map((job) =>
        job.id === jobId ? { ...job, officeReviewedAt: new Date().toISOString(), progress: "Büroprüfung" } : job
      )
    );
  }

  return (
    <div className="grid gap-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge className="mb-3 bg-accent text-accent-foreground">Backoffice</Badge>
          <h2 className="text-3xl font-semibold tracking-normal md:text-4xl">Büroübersicht</h2>
          <p className="mt-2 text-muted-foreground">Disposition, Auftragskontrolle und Übergabe aus der Baustelle.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="outline" size="lg">
            <Link href="/customers">
              <UsersRound className="h-5 w-5" />
              Kunden
            </Link>
          </Button>
          <Button asChild size="lg">
            <Link href="/new">
              <ClipboardPlus className="h-5 w-5" />
              Neuer Auftrag
            </Link>
          </Button>
        </div>
      </section>

      <section aria-label="Kennzahlen" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={CalendarDays} label="Heute eingeplant" value={todaysJobs.length} tone="primary" />
        <MetricCard icon={Clock3} label="Offene Aufträge" value={openJobs.length} tone="neutral" />
        <MetricCard icon={ClipboardCheck} label="Büroprüfung offen" value={reviewJobs.length} tone="warning" />
        <MetricCard icon={CheckCircle2} label="Geprüft abgeschlossen" value={completedJobs.length} tone="success" />
      </section>

      {problemJobs.length > 0 ? (
        <Card className="border-amber-300 bg-amber-50/85">
          <CardHeader>
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-6 w-6 text-amber-700" />
              <div>
                <CardTitle>Klärung erforderlich</CardTitle>
                <CardDescription>
                  {problemJobs.length} {problemJobs.length === 1 ? "Auftrag benötigt" : "Aufträge benötigen"}{" "}
                  Aufmerksamkeit.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-2">
            {problemJobs.slice(0, 4).map((job) => {
              const customer = customers.find((item) => item.id === job.customerId);
              return (
                <Link
                  href={`/jobs/${job.id}`}
                  key={job.id}
                  className="flex min-h-12 items-center justify-between gap-3 rounded-md border border-amber-200 bg-white px-4 py-3 font-medium hover:border-amber-400"
                >
                  <span>
                    {customer ? formatCustomerName(customer.firstName, customer.lastName) : job.id} ·{" "}
                    {problemLabel(job, today)}
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0" />
                </Link>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-4" aria-labelledby="office-jobs-heading">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 id="office-jobs-heading" className="text-2xl font-semibold">
              Auftragssteuerung
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Terminstand und Übergaben auf einen Blick.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-secondary/70 p-1 sm:grid-cols-4">
            <FilterButton active={filter === "today"} onClick={() => setFilter("today")}>
              Heute ({todaysJobs.length})
            </FilterButton>
            <FilterButton active={filter === "open"} onClick={() => setFilter("open")}>
              Offen ({openJobs.length})
            </FilterButton>
            <FilterButton active={filter === "review"} onClick={() => setFilter("review")}>
              Prüfung ({reviewJobs.length})
            </FilterButton>
            <FilterButton active={filter === "completed"} onClick={() => setFilter("completed")}>
              Erledigt ({completedJobs.length})
            </FilterButton>
          </div>
        </div>

        {visibleJobs.length > 0 ? (
          <div className="grid gap-3">
            {visibleJobs.map((job) => (
              <OfficeJobRow
                key={job.id}
                job={job}
                customer={customers.find((item) => item.id === job.customerId)}
                today={today}
                onReviewed={() => markReviewed(job.id)}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              In diesem Bereich gibt es keine Aufträge.
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone
}: {
  icon: typeof CalendarDays;
  label: string;
  value: number;
  tone: "primary" | "neutral" | "warning" | "success";
}) {
  const colors = {
    primary: "bg-blue-50 text-blue-700",
    neutral: "bg-slate-100 text-slate-700",
    warning: "bg-amber-50 text-amber-700",
    success: "bg-emerald-50 text-emerald-700"
  };
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${colors[tone]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <div className="text-3xl font-bold">{value}</div>
          <div className="text-sm text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function FilterButton({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 rounded-md px-3 text-sm font-semibold transition-colors ${
        active ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function OfficeJobRow({
  job,
  customer,
  today,
  onReviewed
}: {
  job: Job;
  customer?: Customer;
  today: string;
  onReviewed: () => void;
}) {
  const requiresReview = job.status === "Abgeschlossen" && !job.officeReviewedAt;
  return (
    <Card>
      <CardContent className="grid gap-4 p-4 md:grid-cols-[7rem_1fr_auto] md:items-center md:p-5">
        <div>
          <div className="text-2xl font-bold text-primary">{scheduledTime(job)}</div>
          <div className="text-xs font-medium text-muted-foreground">{formatAppointment(job, today).split(",")[0]}</div>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <Badge>{job.type}</Badge>
            <Badge className="bg-white">{jobProgressLabel(job)}</Badge>
            {isJobOverdue(job, today) ? <Badge className="bg-amber-100 text-amber-800">Überfällig</Badge> : null}
          </div>
          <h3 className="mt-2 text-lg font-semibold">
            {customer ? formatCustomerName(customer.firstName, customer.lastName) : "Unbekannter Kunde"}
          </h3>
          <p className="truncate text-sm text-muted-foreground">{job.description}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Zuständig: {job.assignedTechnician ?? "noch nicht zugewiesen"}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row md:justify-end">
          {requiresReview ? (
            <Button type="button" onClick={onReviewed}>
              <CheckCircle2 className="h-4 w-4" />
              Büroprüfung abschließen
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <Link href={`/jobs/${job.id}`}>
              Öffnen
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function problemLabel(job: Job, today: string) {
  if (isJobOverdue(job, today)) return "Termin überfällig";
  if (job.acceptance.repairNotPossible === true) return "Nachtermin oder Ersatzteil klären";
  if (!job.assignedTechnician) return "Monteur zuweisen";
  return "Prüfen";
}
