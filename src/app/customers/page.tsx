"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Save, UserPlus } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { CustomerForm } from "@/components/CustomerForm";
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
  address: string;
};

function toEditForm(customer: Customer): CustomerEditForm {
  return {
    customerNumber: customer.customerNumber ?? "",
    firstName: customer.firstName,
    lastName: customer.lastName,
    phone: customer.phone,
    email: customer.email,
    address: customer.address
  };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useLocalStorage<Customer[]>("hsa-customers", mockCustomers);
  const [jobs] = useLocalStorage<Job[]>("hsa-jobs", mockJobs);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id ?? "");
  const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId) ?? customers[0];
  const [editForm, setEditForm] = useState<CustomerEditForm | null>(selectedCustomer ? toEditForm(selectedCustomer) : null);

  useEffect(() => {
    if (!selectedCustomerId && customers[0]) {
      setSelectedCustomerId(customers[0].id);
    }
  }, [customers, selectedCustomerId]);

  useEffect(() => {
    setEditForm(selectedCustomer ? toEditForm(selectedCustomer) : null);
  }, [selectedCustomer]);

  const jobsByCustomer = useMemo(() => {
    return jobs.reduce<Record<string, Job[]>>((groups, job) => {
      groups[job.customerId] = [...(groups[job.customerId] ?? []), job];
      return groups;
    }, {});
  }, [jobs]);

  const selectedJobs = selectedCustomer ? jobsByCustomer[selectedCustomer.id] ?? [] : [];

  function updateEditField(field: keyof CustomerEditForm, value: string) {
    setEditForm((current) => (current ? { ...current, [field]: value } : current));
  }

  function saveCustomer() {
    if (!selectedCustomer || !editForm) {
      return;
    }
    setCustomers(
      customers.map((customer) =>
        customer.id === selectedCustomer.id
          ? {
              ...customer,
              firstName: editForm.firstName.trim(),
              lastName: editForm.lastName.trim(),
              customerNumber: editForm.customerNumber.trim(),
              phone: editForm.phone.trim(),
              email: editForm.email.trim(),
              address: editForm.address.trim()
            }
          : customer
      )
    );
  }

  return (
    <AppShell>
      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader>
            <CardTitle>Kunden verwalten</CardTitle>
            <CardDescription>Stammdaten bearbeiten und Auftragshistorie einsehen</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {customers.map((customer) => (
              <button
                key={customer.id}
                type="button"
                className={`rounded-lg border p-4 text-left shadow-sm transition-colors ${
                  selectedCustomer?.id === customer.id
                    ? "border-sky-400 bg-sky-100 text-slate-950 ring-2 ring-sky-200"
                    : "bg-white hover:bg-secondary/60"
                }`}
                onClick={() => setSelectedCustomerId(customer.id)}
              >
                <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                  {customer.customerNumber || "Keine Kundennummer"}
                </p>
                <h3 className="font-semibold">{formatCustomerName(customer.firstName, customer.lastName)}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{customer.address}</p>
                <div className="mt-3 grid gap-1 text-sm text-foreground">
                  <span>{customer.phone}</span>
                  <span>{customer.email || "Keine E-Mail hinterlegt"}</span>
                </div>
                <Badge className="mt-3">{jobsByCustomer[customer.id]?.length ?? 0} Auftraege</Badge>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Kundendaten</CardTitle>
              <CardDescription>
                {selectedCustomer
                  ? `${selectedCustomer.customerNumber ? `${selectedCustomer.customerNumber} · ` : ""}${formatCustomerName(
                      selectedCustomer.firstName,
                      selectedCustomer.lastName
                    )}`
                  : "Noch kein Kunde ausgewaehlt"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedCustomer && editForm ? (
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
                    <Input
                      id="editFirstName"
                      value={editForm.firstName}
                      onChange={(event) => updateEditField("firstName", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editLastName">Nachname</Label>
                    <Input
                      id="editLastName"
                      value={editForm.lastName}
                      onChange={(event) => updateEditField("lastName", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editPhone">Telefon</Label>
                    <Input id="editPhone" value={editForm.phone} onChange={(event) => updateEditField("phone", event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editEmail">E-Mail</Label>
                    <Input
                      id="editEmail"
                      type="email"
                      value={editForm.email}
                      onChange={(event) => updateEditField("email", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="editAddress">Adresse</Label>
                    <Input
                      id="editAddress"
                      value={editForm.address}
                      onChange={(event) => updateEditField("address", event.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Button type="submit" size="lg">
                      <Save className="h-5 w-5" />
                      Aenderungen speichern
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

          <Card>
            <CardHeader>
              <CardTitle>Neuer Kunde</CardTitle>
              <CardDescription>Kundendaten lokal speichern</CardDescription>
            </CardHeader>
            <CardContent>
              <CustomerForm
                onCreate={(customer) => {
                  setCustomers([customer, ...customers]);
                  setSelectedCustomerId(customer.id);
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
