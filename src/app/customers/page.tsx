"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { CustomerForm } from "@/components/CustomerForm";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { mockCustomers, mockJobs } from "@/data/mock";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { formatCustomerName, formatDateTime, formatAddress } from "@/lib/utils";
import type { Customer, Job } from "@/types";

export default function CustomersPage() {
  const [customers, setCustomers, customersHydrated] = useLocalStorage<Customer[]>("hsa-customers", mockCustomers);
  const [jobs] = useLocalStorage<Job[]>("hsa-jobs", mockJobs);
  const router = useRouter();
  const [showArchived, setShowArchived] = useState(false);
  const [query, setQuery] = useState("");

  // Kundenliste, je nach Toggle nur nicht-archivierte oder alle anzeigen
  const visibleCustomers = showArchived ? customers : customers.filter((c) => c.archived !== true);

  // Migration: fehlende Archivierungsfelder ergänzen, sobald localStorage geladen ist
  useEffect(() => {
    if (!customersHydrated) return;
    const needsMigration = customers.some(
      (c) => typeof c.archived === "undefined" || typeof c.archivedAt === "undefined"
    );
    if (needsMigration) {
      const migrated = customers.map((c) => ({
        ...c,
        archived: c.archived ?? false,
        archivedAt: typeof c.archivedAt === "undefined" ? null : c.archivedAt
      }));
      queueMicrotask(() => setCustomers(migrated));
    }
  }, [customersHydrated, customers, setCustomers]);

  const jobsByCustomer = useMemo(() => {
    return jobs.reduce<Record<string, Job[]>>((groups, job) => {
      groups[job.customerId] = [...(groups[job.customerId] ?? []), job];
      return groups;
    }, {});
  }, [jobs]);

  // Suche: einfache Textsuche über mehrere Felder
  const filteredCustomers = visibleCustomers.filter((c) => {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
    return (
      (c.customerNumber ?? "").toLowerCase().includes(q) ||
      fullName.includes(q) ||
      (c.phone ?? "").toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q) ||
      (c.address ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <AppShell>
      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader>
            <CardTitle>Kunden verwalten</CardTitle>
            <CardDescription>Stammdaten bearbeiten und Auftragshistorie einsehen</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showArchived}
                    onChange={(event) => setShowArchived(event.target.checked)}
                    className="h-4 w-4"
                  />
                  Archivierte Kunden anzeigen
                </label>
                <Input
                  placeholder="Suche Kunden (Name, Nummer, Telefon, E-Mail, Adresse)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </div>
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className={`flex items-start gap-3 ${customer.archived ? "opacity-60" : ""}`}>
                <Link
                  href={`/customers/${customer.id}`}
                  className={`flex-1 rounded-lg border p-4 text-left shadow-sm transition-colors bg-white hover:bg-secondary/60`}
                >
                  <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                    {customer.customerNumber || "Keine Kundennummer"}
                  </p>
                  <h3 className="font-semibold">{formatCustomerName(customer.firstName, customer.lastName)}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{formatAddress(customer)}</p>
                  <div className="mt-3 grid gap-1 text-sm text-foreground">
                    <span>{customer.phone}</span>
                    <span>{customer.email || "Keine E-Mail hinterlegt"}</span>
                  </div>
                  <div className="mt-3">
                    <Badge>{jobsByCustomer[customer.id]?.length ?? 0} Auftraege</Badge>
                    {customer.archived && (
                      <span className="ml-2 inline-flex items-center gap-2">
                        <Badge>Archiviert</Badge>
                        {customer.archivedAt && (
                          <span className="text-xs text-muted-foreground">{formatDateTime(customer.archivedAt)}</span>
                        )}
                      </span>
                    )}
                  </div>
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Neuer Kunde</CardTitle>
              <CardDescription>Kundendaten lokal speichern</CardDescription>
            </CardHeader>
            <CardContent>
              <CustomerForm
                onCreate={(customer) => {
                  setCustomers([customer, ...customers]);
                  router.push(`/customers/${customer.id}`);
                }}
              />
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <UserPlus className="h-4 w-4" />
                Neue Kunden erscheinen direkt in der Verwaltung.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
