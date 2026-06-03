"use client";

import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mockCustomers, mockJobs } from "@/data/mock";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { formatCustomerName, formatDateTime } from "@/lib/utils";
import type { Customer, Job } from "@/types";

export default function JobsPage() {
  const [customers] = useLocalStorage<Customer[]>("hsa-customers", mockCustomers);
  const [jobs] = useLocalStorage<Job[]>("hsa-jobs", mockJobs);

  return (
    <AppShell>
      <div className="grid gap-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-normal">Auftraege</h2>
            <p className="mt-2 text-muted-foreground">Alle lokal erfassten Einsaetze, Auftragsdetails und Protokolle.</p>
          </div>
          <Button asChild size="lg">
            <Link href="/new">
              <Plus className="h-5 w-5" />
              Neuer Auftrag
            </Link>
          </Button>
        </div>

        <div className="grid gap-4">
          {jobs.map((job) => {
            const customer = customers.find((item) => item.id === job.customerId);
            const materialLines = (job.materials ?? []).filter((line) => line.materialName);
            const materialSum = materialLines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
            const toolLines = (job.tools ?? []).filter((line) => line.toolName);
            const toolSum = toolLines.reduce((sum, line) => sum + line.quantity * line.costRate, 0);
            return (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Card className="transition-colors hover:border-primary/45 hover:bg-white/95">
                  <CardHeader>
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <CardTitle>{job.type}</CardTitle>
                      <CardDescription>
                          {customer
                            ? `${customer.customerNumber ? `${customer.customerNumber} · ` : ""}${formatCustomerName(
                                customer.firstName,
                                customer.lastName
                              )}`
                            : "Unbekannter Kunde"} ·{" "}
                          {formatDateTime(job.createdAt)}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>{job.status}</Badge>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
                    <div>
                      <p className="font-medium">{job.description}</p>
                      {job.notes && <p className="mt-2 text-sm text-muted-foreground">{job.notes}</p>}
                    </div>
                    <div className="grid gap-2 rounded-lg bg-secondary/60 p-4 text-sm">
                      <span>Arbeitszeit: {job.startTime} bis {job.endTime}</span>
                      <span>Monteure: {job.technicianCount ?? "nicht erfasst"}</span>
                      {job.type === "Notdienst" && (
                        <span>Notdienst-Zulage: {job.emergencySurchargePercent ? `${job.emergencySurchargePercent} Prozent` : "nicht erfasst"}</span>
                      )}
                      <span>Material: {materialLines.length > 0 ? formatCurrency(materialSum) : "nicht erfasst"}</span>
                      <span>Werkzeug: {toolLines.length > 0 ? formatCurrency(toolSum) : "nicht erfasst"}</span>
                      <span>Fotos: {job.photos.length}</span>
                      <span>Abnahme: {job.acceptance.customerConfirmed === true ? "vom Kunden bestaetigt" : "offen"}</span>
                      {job.acceptance.repairNotPossible === true && <span>Reparatur: nicht moeglich</span>}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR"
  }).format(value);
}
