"use client";

import Link from "next/link";
import { ArrowRight, ClipboardCheck, Clock3, UsersRound, Wrench } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mockCustomers, mockJobs } from "@/data/mock";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { formatCustomerName, formatDateTime } from "@/lib/utils";
import type { Customer, Job } from "@/types";

export function Dashboard() {
  const [customers] = useLocalStorage<Customer[]>("hsa-customers", mockCustomers);
  const [jobs] = useLocalStorage<Job[]>("hsa-jobs", mockJobs);
  const completedJobs = jobs.filter((job) => job.status === "Abgeschlossen").length;
  const openJobs = jobs.filter((job) => job.status !== "Abgeschlossen").length;
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.archived !== true).length;

  return (
    <div className="grid gap-5">
      <section className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-lg border border-white/70 bg-white/82 p-6 shadow-soft backdrop-blur-xl md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <Badge className="mb-4 bg-accent text-accent-foreground">iPad First Service Desk</Badge>
              <h2 className="text-3xl font-semibold tracking-normal md:text-5xl">Vor-Ort-Auftraege sauber erfassen.</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Kunden, Rechtliches, Schadensbilder, Arbeitszeiten und Abnahme in einem gefuehrten Ablauf.
              </p>
            </div>
            <Button asChild size="lg">
              <Link href="/new">
                Neuer Auftrag <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Heute</CardTitle>
            <CardDescription>Lokaler Arbeitsstand</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Metric icon={Wrench} label="Offene Einsaetze" value={openJobs} />
            <Metric icon={ClipboardCheck} label="Abgeschlossen" value={completedJobs} />
            <Metric icon={UsersRound} label="Kunden" value={`${activeCustomers} / ${totalCustomers}`} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Aktuelle Auftraege</CardTitle>
            <CardDescription>Die letzten erfassten Einsaetze</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {jobs.slice(0, 4).map((job) => {
              const customer = customers.find((item) => item.id === job.customerId);
              return (
                <Link
                  href="/jobs"
                  key={job.id}
                  className="grid gap-3 rounded-lg border bg-white p-4 transition-colors hover:bg-secondary/50 md:grid-cols-[1fr_auto] md:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{job.type}</h3>
                      <Badge>{job.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {customer
                        ? `${customer.customerNumber ? `${customer.customerNumber} · ` : ""}${formatCustomerName(
                            customer.firstName,
                            customer.lastName
                          )}`
                        : "Unbekannter Kunde"} ·{" "}
                      {job.description}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">{formatDateTime(job.createdAt)}</span>
                </Link>
              );
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Schnellzugriff</CardTitle>
            <CardDescription>Wichtige Bereiche</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              ["Kunden verwalten", "/customers"],
              ["Auftraege ansehen", "/jobs"],
              ["Einstellungen", "/settings"]
            ].map(([label, href]) => (
              <Button key={href} asChild variant="outline" className="justify-between">
                <Link href={href}>
                  {label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-secondary/70 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-white text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <span className="font-medium">{label}</span>
      </div>
      <span className="text-2xl font-semibold">{value}</span>
    </div>
  );
}
