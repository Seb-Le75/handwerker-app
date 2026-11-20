"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarClock, ChevronLeft, ChevronRight, Clock3, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mockCustomers, mockJobs, mockTechnicians } from "@/data/mock";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { localDateKey } from "@/lib/jobs";
import { addCalendarDays, formatPlanningDay, formatPlanningWeek, startOfWeek, weekDateKeys } from "@/lib/planning";
import { formatCustomerName } from "@/lib/utils";
import type { Customer, Job } from "@/types";

export function PlanningBoard() {
  const [jobs, setJobs] = useLocalStorage<Job[]>("hsa-jobs", mockJobs);
  const [customers] = useLocalStorage<Customer[]>("hsa-customers", mockCustomers);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(localDateKey()));
  const [editingJobId, setEditingJobId] = useState("");
  const openJobs = jobs.filter((job) => job.status === "Offen");
  const unplannedJobs = openJobs.filter(
    (job) => !job.scheduledDate || !job.scheduledStartTime || !job.assignedTechnician
  );
  const dates = weekDateKeys(weekStart);
  const editingJob = jobs.find((job) => job.id === editingJobId);

  function updateJob(id: string, next: Partial<Job>) {
    setJobs(jobs.map((job) => (job.id === id ? { ...job, ...next, progress: "Geplant" } : job)));
  }

  return (
    <div className="grid gap-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge className="mb-3 bg-accent text-accent-foreground">Backoffice</Badge>
          <h2 className="text-3xl font-semibold md:text-4xl">Wochenplanung</h2>
          <p className="mt-2 text-muted-foreground">
            Termine und Mitarbeiter zuweisen. Änderungen erscheinen sofort im Baustellenbereich „Heute“.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/office">Zur Büroübersicht</Link>
        </Button>
      </section>

      {unplannedJobs.length > 0 ? (
        <Card className="border-amber-300 bg-amber-50/85">
          <CardHeader>
            <CardTitle>Noch nicht vollständig eingeplant</CardTitle>
            <CardDescription>{unplannedJobs.length} Aufträge benötigen Termin oder Mitarbeiter.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {unplannedJobs.map((job) => (
              <Button key={job.id} type="button" variant="outline" onClick={() => setEditingJobId(job.id)}>
                {job.description}
              </Button>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {editingJob ? (
        <Card className="border-primary/35">
          <CardHeader>
            <CardTitle>Planung bearbeiten</CardTitle>
            <CardDescription>{editingJob.description}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="planning-date">Einsatzdatum</Label>
              <Input
                id="planning-date"
                type="date"
                value={editingJob.scheduledDate ?? ""}
                onChange={(event) => updateJob(editingJob.id, { scheduledDate: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="planning-time">Startzeit</Label>
              <Input
                id="planning-time"
                type="time"
                value={editingJob.scheduledStartTime ?? ""}
                onChange={(event) => updateJob(editingJob.id, { scheduledStartTime: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="planning-technician">Mitarbeiter</Label>
              <select
                id="planning-technician"
                className="min-h-12 w-full rounded-md border border-input bg-background px-3"
                value={editingJob.assignedTechnician ?? ""}
                onChange={(event) => updateJob(editingJob.id, { assignedTechnician: event.target.value })}
              >
                <option value="">Mitarbeiter auswählen</option>
                {mockTechnicians.map((technician) => (
                  <option value={technician} key={technician}>
                    {technician}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-2 sm:col-span-3 sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setEditingJobId("")}>
                Fertig
              </Button>
              <Button asChild>
                <Link href={`/jobs/${editingJob.id}`}>Auftrag öffnen</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{formatPlanningWeek(weekStart)}</CardTitle>
              <CardDescription>Montag bis Sonntag</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setWeekStart(addCalendarDays(weekStart, -7))}
                aria-label="Vorherige Woche"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setWeekStart(startOfWeek(localDateKey()))}
              >
                Diese Woche
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setWeekStart(addCalendarDays(weekStart, 7))}
                aria-label="Nächste Woche"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto pb-5">
          <div className="grid min-w-[1120px] grid-cols-7 gap-3">
            {dates.map((date) => {
              const dayJobs = openJobs
                .filter((job) => job.scheduledDate === date)
                .sort((left, right) => (left.scheduledStartTime ?? "").localeCompare(right.scheduledStartTime ?? ""));
              return (
                <section key={date} className="min-h-72 rounded-lg border bg-secondary/35 p-3">
                  <h3 className="border-b pb-2 text-sm font-semibold">{formatPlanningDay(date)}</h3>
                  <div className="mt-3 grid gap-2">
                    {dayJobs.length > 0 ? (
                      dayJobs.map((job) => {
                        const customer = customers.find((item) => item.id === job.customerId);
                        return (
                          <button
                            key={job.id}
                            type="button"
                            onClick={() => setEditingJobId(job.id)}
                            className="rounded-md border bg-white p-3 text-left shadow-sm transition hover:border-primary/45"
                          >
                            <span className="flex items-center gap-1 text-sm font-bold text-primary">
                              <Clock3 className="h-3.5 w-3.5" />
                              {job.scheduledStartTime || "Ohne Zeit"}
                            </span>
                            <strong className="mt-1 block text-sm">
                              {customer
                                ? formatCustomerName(customer.firstName, customer.lastName)
                                : "Unbekannter Kunde"}
                            </strong>
                            <span className="mt-1 line-clamp-2 block text-xs text-muted-foreground">
                              {job.description}
                            </span>
                            <span className="mt-2 flex items-center gap-1 text-xs font-medium">
                              <UserRound className="h-3.5 w-3.5" />
                              {job.assignedTechnician || "Nicht zugewiesen"}
                            </span>
                          </button>
                        );
                      })
                    ) : (
                      <div className="grid justify-items-center gap-2 py-8 text-center text-xs text-muted-foreground">
                        <CalendarClock className="h-5 w-5" />
                        Keine Termine
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
