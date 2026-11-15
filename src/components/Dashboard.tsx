"use client";

import Link from "next/link";
import { CalendarClock, ChevronRight, ClipboardPlus, MapPin, Phone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mockCustomers, mockJobs } from "@/data/mock";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { compareJobsByAppointment, localDateKey, scheduledDate, scheduledTime } from "@/lib/jobs";
import { formatAddress, formatCustomerName } from "@/lib/utils";
import type { Customer, Job } from "@/types";

export function Dashboard() {
  const [customers] = useLocalStorage<Customer[]>("hsa-customers", mockCustomers);
  const [jobs] = useLocalStorage<Job[]>("hsa-jobs", mockJobs);
  const today = localDateKey();
  const openJobs = jobs.filter((job) => job.status === "Offen").sort(compareJobsByAppointment);
  const todaysJobs = openJobs.filter((job) => scheduledDate(job, today) === today);
  const visibleJobs = todaysJobs.length > 0 ? todaysJobs : openJobs.slice(0, 4);

  return (
    <div className="grid gap-5">
      <section aria-labelledby="current-jobs-heading">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge className="mb-3 bg-accent text-accent-foreground">Mein Arbeitstag</Badge>
            <h2 id="current-jobs-heading" className="text-3xl font-semibold tracking-normal md:text-4xl">
              {todaysJobs.length > 0 ? "Heute anstehende Einsätze" : "Nächste Einsätze"}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {visibleJobs.length} {visibleJobs.length === 1 ? "Einsatz" : "Einsätze"} · der nächste Termin steht oben.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/jobs">Alle Aufträge</Link>
          </Button>
        </div>

        {visibleJobs.length > 0 ? (
          <div className="grid gap-4">
            {visibleJobs.map((job, index) => {
              const customer = customers.find((item) => item.id === job.customerId);
              return (
                <Link
                  href={`/jobs/${job.id}`}
                  key={job.id}
                  className="group grid min-h-28 gap-4 rounded-lg border bg-white p-4 shadow-sm transition hover:border-primary/45 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:grid-cols-[9rem_1fr_auto] md:items-center md:p-5"
                >
                  <div className="flex items-center gap-3 md:block">
                    <div className="text-3xl font-bold tracking-tight text-primary">{scheduledTime(job)}</div>
                    <div className="text-sm font-medium text-muted-foreground">
                      {scheduledDate(job, today) === today ? "Heute" : formatShortDate(scheduledDate(job, today))}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {index === 0 ? <Badge className="bg-primary text-primary-foreground">Als Nächstes</Badge> : null}
                      <Badge>{job.type}</Badge>
                    </div>
                    <h3 className="mt-2 text-lg font-semibold">
                      {customer ? formatCustomerName(customer.firstName, customer.lastName) : "Unbekannter Kunde"}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{job.description}</p>
                    {customer ? (
                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-4 w-4" />
                          {formatAddress(customer)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="h-4 w-4" />
                          {customer.phone}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t pt-3 md:border-l md:border-t-0 md:pl-5 md:pt-0">
                    <span className="font-semibold text-primary">Auftrag öffnen</span>
                    <ChevronRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
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

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="outline" size="lg">
            <Link href="/new">
              <ClipboardPlus className="h-5 w-5" />
              Neuen Auftrag erfassen
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" }).format(
    new Date(`${value}T12:00:00`)
  );
}
