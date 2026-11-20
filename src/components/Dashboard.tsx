"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  ChevronRight,
  ClipboardPlus,
  MapPin,
  Navigation,
  Phone,
  Play,
  Route,
  Wrench
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mockCustomers, mockJobs } from "@/data/mock";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { compareJobsByAppointment, jobProgressLabel, localDateKey, scheduledDate, scheduledTime } from "@/lib/jobs";
import { formatAddress, formatCustomerName } from "@/lib/utils";
import type { Customer, Job, JobProgress } from "@/types";

export function Dashboard() {
  const router = useRouter();
  const [customers] = useLocalStorage<Customer[]>("hsa-customers", mockCustomers);
  const [jobs, setJobs] = useLocalStorage<Job[]>("hsa-jobs", mockJobs);
  const today = localDateKey();
  const openJobs = jobs
    .filter((job) => job.status === "Offen" && (!job.assignedTechnician || job.assignedTechnician === "Mara Klein"))
    .sort(compareJobsByAppointment);
  const todaysJobs = openJobs.filter((job) => scheduledDate(job, today) === today);
  const visibleJobs = todaysJobs.length > 0 ? todaysJobs : openJobs.slice(0, 4);
  const nextJob = visibleJobs[0];
  const remainingJobs = visibleJobs.slice(1);

  function updateProgress(job: Job, progress: JobProgress) {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    setJobs(
      jobs.map((item) =>
        item.id === job.id
          ? { ...item, progress, startTime: progress === "In Arbeit" && !item.startTime ? time : item.startTime }
          : item
      )
    );
  }

  function beginWork(job: Job) {
    updateProgress(job, "In Arbeit");
    router.push(`/new?jobId=${encodeURIComponent(job.id)}&step=work`);
  }

  return (
    <div className="grid gap-6">
      <section aria-labelledby="current-jobs-heading">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge className="mb-3 bg-accent text-accent-foreground">Baustellenmodus · Mara Klein</Badge>
            <h2 id="current-jobs-heading" className="text-3xl font-semibold tracking-normal md:text-4xl">
              {todaysJobs.length > 0 ? "Mein nächster Einsatz" : "Nächster offener Einsatz"}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {todaysJobs.length > 0
                ? `${todaysJobs.length} ${todaysJobs.length === 1 ? "Termin" : "Termine"} heute`
                : "Heute ist kein weiterer Termin eingeplant."}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/jobs">Alle Aufträge</Link>
          </Button>
        </div>

        {nextJob ? (
          <NextJobCard
            job={nextJob}
            customer={customers.find((item) => item.id === nextJob.customerId)}
            today={today}
            onProgress={(progress) => updateProgress(nextJob, progress)}
            onBegin={() => beginWork(nextJob)}
          />
        ) : (
          <Card>
            <CardHeader>
              <CalendarClock className="mb-2 h-9 w-9 text-accent" />
              <CardTitle>Keine offenen Einsätze</CardTitle>
              <CardDescription>Aktuell ist kein Auftrag zur Bearbeitung eingeplant.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/new">Ersten Auftrag erfassen</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      {remainingJobs.length > 0 ? (
        <section aria-labelledby="remaining-jobs-heading" className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 id="remaining-jobs-heading" className="text-xl font-semibold">
              Danach
            </h2>
            <span className="text-sm text-muted-foreground">Nach Uhrzeit sortiert</span>
          </div>
          {remainingJobs.map((job) => {
            const customer = customers.find((item) => item.id === job.customerId);
            return (
              <Link
                href={`/jobs/${job.id}`}
                key={job.id}
                className="group grid min-h-24 gap-3 rounded-lg border bg-white p-4 shadow-sm transition hover:border-primary/45 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:grid-cols-[7rem_1fr_auto] sm:items-center"
              >
                <div>
                  <div className="text-2xl font-bold text-primary">{scheduledTime(job)}</div>
                  <div className="text-xs font-medium text-muted-foreground">
                    {scheduledDate(job, today) === today ? "Heute" : formatShortDate(scheduledDate(job, today))}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2">
                    <Badge>{job.type}</Badge>
                    <Badge className="bg-white">{jobProgressLabel(job)}</Badge>
                  </div>
                  <h3 className="mt-2 font-semibold">
                    {customer ? formatCustomerName(customer.firstName, customer.lastName) : "Unbekannter Kunde"}
                  </h3>
                  <p className="truncate text-sm text-muted-foreground">{job.description}</p>
                </div>
                <ChevronRight className="h-6 w-6 text-primary transition-transform group-hover:translate-x-1" />
              </Link>
            );
          })}
        </section>
      ) : null}

      <Button asChild variant="outline" size="lg" className="justify-self-start">
        <Link href="/new">
          <ClipboardPlus className="h-5 w-5" />
          Neuen Auftrag erfassen
        </Link>
      </Button>
    </div>
  );
}

function NextJobCard({
  job,
  customer,
  today,
  onProgress,
  onBegin
}: {
  job: Job;
  customer?: Customer;
  today: string;
  onProgress: (progress: JobProgress) => void;
  onBegin: () => void;
}) {
  const address = formatAddress(customer);
  const progress = jobProgressLabel(job);

  return (
    <Card className="overflow-hidden border-primary/30 shadow-md">
      <div className="bg-primary px-5 py-4 text-primary-foreground">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold">{scheduledTime(job)}</span>
            <span className="font-semibold">
              {scheduledDate(job, today) === today ? "Heute" : formatShortDate(scheduledDate(job, today))}
            </span>
          </div>
          <Badge className="bg-white text-primary">{progress}</Badge>
        </div>
      </div>
      <CardContent className="grid gap-5 p-5 md:p-6">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge>{job.type}</Badge>
            {job.assignedTechnician ? <Badge className="bg-white">{job.assignedTechnician}</Badge> : null}
          </div>
          <h3 className="mt-3 text-2xl font-semibold">
            {customer ? formatCustomerName(customer.firstName, customer.lastName) : "Unbekannter Kunde"}
          </h3>
          <p className="mt-2 text-base leading-relaxed">{job.description}</p>
          {address ? (
            <p className="mt-3 flex items-start gap-2 text-muted-foreground">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0" />
              {address}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {customer?.phone ? (
            <Button asChild variant="outline" size="lg">
              <a href={`tel:${customer.phone}`}>
                <Phone className="h-5 w-5" />
                Anrufen
              </a>
            </Button>
          ) : null}
          {address ? (
            <Button asChild variant="outline" size="lg">
              <a href={`https://maps.apple.com/?daddr=${encodeURIComponent(address)}`} target="_blank" rel="noreferrer">
                <Navigation className="h-5 w-5" />
                Navigation
              </a>
            </Button>
          ) : null}
          {progress === "Geplant" ? (
            <Button type="button" variant="secondary" size="lg" onClick={() => onProgress("Unterwegs")}>
              <Route className="h-5 w-5" />
              Anfahrt starten
            </Button>
          ) : null}
          {progress !== "In Arbeit" ? (
            <Button type="button" size="lg" onClick={onBegin}>
              <Play className="h-5 w-5" />
              Arbeit beginnen
            </Button>
          ) : (
            <Button asChild size="lg">
              <Link href={`/new?jobId=${encodeURIComponent(job.id)}&step=work`}>
                <Wrench className="h-5 w-5" />
                Einsatz dokumentieren
              </Link>
            </Button>
          )}
        </div>

        <Button asChild variant="ghost" className="justify-self-start">
          <Link href={`/jobs/${job.id}`}>
            Auftrag öffnen
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" }).format(
    new Date(`${value}T12:00:00`)
  );
}
