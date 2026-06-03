"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createId } from "@/lib/utils";
import type { Customer } from "@/types";

type CustomerFormProps = {
  onCreate: (customer: Customer) => void;
};

const emptyCustomer = {
  customerNumber: "",
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  address: ""
};

export function CustomerForm({ onCreate }: CustomerFormProps) {
  const [form, setForm] = useState(emptyCustomer);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const canSubmit = form.firstName.trim() && form.lastName.trim() && form.phone.trim() && form.address.trim();

  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSubmit) {
          return;
        }
        onCreate({
          id: createId("cust"),
          ...form,
          customerNumber: form.customerNumber.trim(),
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          address: form.address.trim()
        });
        setForm(emptyCustomer);
      }}
    >
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="customerNumber">Kundennummer</Label>
        <Input
          id="customerNumber"
          value={form.customerNumber}
          onChange={(event) => updateField("customerNumber", event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="firstName">Vorname</Label>
        <Input id="firstName" value={form.firstName} onChange={(event) => updateField("firstName", event.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lastName">Nachname</Label>
        <Input id="lastName" value={form.lastName} onChange={(event) => updateField("lastName", event.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Telefon</Label>
        <Input id="phone" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">E-Mail</Label>
        <Input id="email" type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="address">Adresse</Label>
        <Input id="address" value={form.address} onChange={(event) => updateField("address", event.target.value)} />
      </div>
      <div className="md:col-span-2">
        <Button type="submit" size="lg" disabled={!canSubmit}>
          Kunden anlegen
        </Button>
      </div>
    </form>
  );
}
