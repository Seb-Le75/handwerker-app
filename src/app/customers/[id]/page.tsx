"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mockCustomers, mockJobs } from "@/data/mock";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { formatCustomerName, formatDateTime } from "@/lib/utils";
import type { Customer, Job } from "@/types";

type CustomerEditForm = {
  customerNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
};

function toEditForm(customer: Customer): CustomerEditForm {
  return {
    customerNumber: customer.customerNumber ?? "",
    firstName: customer.firstName,
    lastName: customer.lastName,
    phone: customer.phone,
    email: customer.email,
    street: customer.street ?? "",
    houseNumber: customer.houseNumber ?? "",
    postalCode: customer.postalCode ?? "",
    city: customer.city ?? ""
  };
}

export default function CustomerDetailPage() {
  const params = useParams() as { id?: string };
  const router = useRouter();
  const [customers, setCustomers, customersHydrated] = useLocalStorage<Customer[]>("hsa-customers", mockCustomers);
  const [jobs] = useLocalStorage<Job[]>("hsa-jobs", mockJobs);

  const customer = params.id ? customers.find((c) => c.id === params.id) : undefined;

  useEffect(() => {
    if (!customersHydrated) return;
    // ensure archived fields exist (lightweight migration)
    const needsMigration = customers.some((c) => typeof c.archived === "undefined" || typeof c.archivedAt === "undefined");
    if (needsMigration) {
      const migrated = customers.map((c) => ({
        ...c,
        archived: c.archived ?? false,
        archivedAt: typeof c.archivedAt === "undefined" ? null : c.archivedAt
      }));
      setCustomers(migrated);
    }
  }, [customersHydrated, customers, setCustomers]);

  // edit form state must be declared unconditionally to satisfy React Hook rules
  const emptyEditForm: CustomerEditForm = {
    customerNumber: "",
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    street: "",
    houseNumber: "",
    postalCode: "",
    city: ""
  };
  const [editForm, setEditForm] = useState<CustomerEditForm>(customer ? toEditForm(customer) : emptyEditForm);

  // edit form sync
  // keep editForm in sync with the loaded customer
  useEffect(() => {
    if (customer) {
      setEditForm(toEditForm(customer));
    } else {
      setEditForm(emptyEditForm);
    }
  }, [customer]);

  // Additional hook state for validation must be declared before any early returns
  const [postalCodeError, setPostalCodeError] = useState<string | null>(null);
  const [cityError, setCityError] = useState<string | null>(null);

  // Loading state while localStorage hydrates
  if (!customersHydrated) {
    return (
      <AppShell>
        <Card>
          <CardHeader>
            <CardTitle>Kunde wird geladen</CardTitle>
            <CardDescription>Die lokalen Daten werden vorbereitet.</CardDescription>
          </CardHeader>
        </Card>
      </AppShell>
    );
  }

  if (!customer) {
    return (
      <AppShell>
        <Card>
          <CardHeader>
            <CardTitle>Kunde nicht gefunden</CardTitle>
            <CardDescription>Dieser Kunde ist lokal auf diesem Gerät nicht vorhanden.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/customers">
                <ArrowLeft className="h-4 w-4" />
                Zurück zur Kundenübersicht
              </Link>
            </Button>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  // direkte Ermittlung der Aufträge dieses Kunden, sortiert nach Erstellungsdatum absteigend
  const selectedJobs = jobs
    .filter((job) => job.customerId === customer.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  function updateEditField(field: keyof CustomerEditForm, value: string) {
    setEditForm((current) => ({ ...current, [field]: value }));
  }

  function validateEdit(): boolean {
    setPostalCodeError(null);
    setCityError(null);
    const plz = editForm.postalCode.trim();
    const city = editForm.city.trim();
    const plzRegex = /^\d{5}$/;
    let ok = true;
    if (!plzRegex.test(plz)) {
      setPostalCodeError("Die Postleitzahl muss 5-stellig und numerisch sein.");
      ok = false;
    }
    if (!city) {
      setCityError("Ort ist erforderlich, wenn Postleitzahl angegeben ist.");
      ok = false;
    }
    return ok;
  }

  function saveCustomer() {
    if (!validateEdit()) return;
    if (!customer) return;
    const custId = customer.id;
    setCustomers(
      customers.map((c) =>
        c.id === custId
          ? {
              ...c,
              firstName: editForm.firstName.trim(),
              lastName: editForm.lastName.trim(),
              customerNumber: editForm.customerNumber.trim(),
              phone: editForm.phone.trim(),
              email: editForm.email.trim(),
              // save structured address fields and update legacy address
              street: editForm.street.trim(),
              houseNumber: editForm.houseNumber.trim(),
              postalCode: editForm.postalCode.trim(),
              city: editForm.city.trim(),
              address: `${editForm.street.trim()} ${editForm.houseNumber.trim()}, ${editForm.postalCode.trim()} ${editForm.city.trim()}`.trim()
            }
          : c
      )
    );
  }

  return (
    <AppShell>
      <div className="grid gap-5">
        <div className="print-hidden flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <Button asChild variant="outline">
              <Link href="/customers">
                <ArrowLeft className="h-4 w-4" />
                Zurück zur Kundenübersicht
              </Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Kundendaten</CardTitle>
            <CardDescription>
              {customer ? `${customer.customerNumber ? `${customer.customerNumber} · ` : ""}${formatCustomerName(
                customer.firstName,
                customer.lastName
              )}` : "Noch kein Kunde ausgewaehlt"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {customer && editForm ? (
              <form
                className="grid gap-4 md:grid-cols-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  saveCustomer();
                }}
              >
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="editCustomerNumber">Kundennummer</Label>
                  <Input
                    id="editCustomerNumber"
                    value={editForm.customerNumber}
                    onChange={(event) => updateEditField("customerNumber", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editFirstName">Vorname</Label>
                  <Input id="editFirstName" value={editForm.firstName} onChange={(event) => updateEditField("firstName", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editLastName">Nachname</Label>
                  <Input id="editLastName" value={editForm.lastName} onChange={(event) => updateEditField("lastName", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editPhone">Telefon</Label>
                  <Input id="editPhone" value={editForm.phone} onChange={(event) => updateEditField("phone", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editEmail">E-Mail</Label>
                  <Input id="editEmail" type="email" value={editForm.email} onChange={(event) => updateEditField("email", event.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="editStreet">Straße</Label>
                  <Input id="editStreet" value={editForm.street} onChange={(event) => updateEditField("street", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editHouseNumber">Hausnummer</Label>
                  <Input id="editHouseNumber" value={editForm.houseNumber} onChange={(event) => updateEditField("houseNumber", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editPostalCode">Postleitzahl</Label>
                  <Input id="editPostalCode" value={editForm.postalCode} onChange={(event) => updateEditField("postalCode", event.target.value)} />
                  {postalCodeError && <p className="mt-1 text-sm text-red-600">{postalCodeError}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editCity">Ort</Label>
                  <Input id="editCity" value={editForm.city} onChange={(event) => updateEditField("city", event.target.value)} />
                  {cityError && <p className="mt-1 text-sm text-red-600">{cityError}</p>}
                </div>
                <div className="md:col-span-2 flex items-center gap-3">
                  <Button type="submit" size="lg">
                    Speichern
                  </Button>
                  {customer.archived ? (
                    <Button
                      type="button"
                      size="lg"
                      variant="secondary"
                      onClick={() => {
                        // Reaktivieren
                        setCustomers(customers.map((c) => (c.id === customer.id ? { ...c, archived: false, archivedAt: null } : c)));
                      }}
                    >
                      Reaktivieren
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="lg"
                      variant="outline"
                      onClick={() => {
                        const openCount = (selectedJobs ?? []).filter((j) => j.status === "Offen").length;
                        const message = openCount > 0
                          ? `Kunden wirklich archivieren? Dieser Kunde hat ${openCount} offene Aufträge. Archivierte Kunden sind nicht mehr für neue Aufträge auswählbar.`
                          : "Kunden wirklich archivieren? Archivierte Kunden sind nicht mehr für neue Aufträge auswählbar.";
                        if (!confirm(message)) {
                          return;
                        }
                        setCustomers(customers.map((c) => (c.id === customer.id ? { ...c, archived: true, archivedAt: new Date().toISOString() } : c)));
                      }}
                    >
                      Archivieren
                    </Button>
                  )}

                  <Button
                    type="button"
                    size="lg"
                    onClick={() => router.push(`/new?customerId=${encodeURIComponent(customer.id)}`)}
                    disabled={customer.archived === true}
                  >
                    Neuer Auftrag
                  </Button>
                </div>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground">Lege zuerst einen Kunden an.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Auftraege des Kunden</CardTitle>
            <CardDescription>{selectedJobs.length} lokal gespeicherte Einsaetze</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {selectedJobs.length > 0 ? (
              selectedJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="grid gap-3 rounded-lg border bg-white p-4 shadow-sm transition-colors hover:bg-secondary/60 md:grid-cols-[1fr_auto] md:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{job.type}</h3>
                      <Badge>{job.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{job.description || "Keine Auftragsdetails erfasst"}</p>
                    <p className="mt-2 text-sm font-medium">{formatDateTime(job.createdAt)}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </Link>
              ))
            ) : (
              <div className="rounded-lg border bg-white p-4 text-sm text-muted-foreground shadow-sm">
                Fuer diesen Kunden wurden noch keine Auftraege erstellt.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
