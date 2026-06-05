"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createId } from "@/lib/utils";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { mockCustomers } from "@/data/mock";
import type { Customer } from "@/types";

type CustomerFormProps = {
  onCreate: (customer: Customer) => void;
};

const emptyCustomerForm = {
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

export function CustomerForm({ onCreate }: CustomerFormProps) {
  const [form, setForm] = useState(() => ({ ...emptyCustomerForm }));
  // vorhandene Kunden aus localStorage zur Bestimmung der naechsten Kundennummer
  const [customers] = useLocalStorage<Customer[]>("hsa-customers", mockCustomers);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  // berechne die naechste freie Kundennummer basierend auf vorhandenen Nummern
  const suggestedCustomerNumber = useMemo(() => {
    let max = 1000;
    customers.forEach((c) => {
      const num = c.customerNumber ?? "";
      const m = num.match(/(\d+)$/);
      if (m) {
        const n = parseInt(m[1], 10);
        if (!isNaN(n) && n > max) max = n;
      }
    });
    return `K-${max + 1}`;
  }, [customers]);

  // Wenn das Feld noch leer ist, automatisch Vorschlag eintragen (bleibt editierbar)
  useEffect(() => {
    if (!form.customerNumber || !form.customerNumber.trim()) {
      setForm((current) => ({ ...current, customerNumber: suggestedCustomerNumber }));
    }
  }, [suggestedCustomerNumber]);

  const addressString = `${form.street.trim()} ${form.houseNumber.trim()}, ${form.postalCode.trim()} ${form.city.trim()}`.trim();

  const [postalCodeError, setPostalCodeError] = useState<string | null>(null);
  const [cityError, setCityError] = useState<string | null>(null);

  // Validation: PLZ must be exactly 5 digits; city required when PLZ is provided
  function validate(): boolean {
    let ok = true;
    setPostalCodeError(null);
    setCityError(null);
    const plz = form.postalCode.trim();
    const city = form.city.trim();
    const plzRegex = /^\d{5}$/;
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

  const canSubmit = form.firstName.trim() && form.lastName.trim() && form.phone.trim() && form.postalCode.trim() && form.city.trim();

  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSubmit) {
          return;
        }
        if (!validate()) return;
        onCreate({
          id: createId("cust"),
          customerNumber: form.customerNumber.trim(),
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          // structured address fields
          street: form.street.trim(),
          houseNumber: form.houseNumber.trim(),
          postalCode: form.postalCode.trim(),
          city: form.city.trim(),
          // legacy address for backward compatibility
          address: addressString,
          // Neu: Archivierungsfelder mit Standardwerten
          archived: false,
          archivedAt: null
        });
        setForm({ ...emptyCustomerForm });
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
        <Label htmlFor="street">Straße</Label>
        <Input id="street" value={form.street} onChange={(event) => updateField("street", event.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="houseNumber">Hausnummer</Label>
        <Input id="houseNumber" value={form.houseNumber} onChange={(event) => updateField("houseNumber", event.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="postalCode">Postleitzahl</Label>
        <Input id="postalCode" value={form.postalCode} onChange={(event) => updateField("postalCode", event.target.value)} />
        {postalCodeError && <p className="mt-1 text-sm text-red-600">{postalCodeError}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="city">Ort</Label>
        <Input id="city" value={form.city} onChange={(event) => updateField("city", event.target.value)} />
        {cityError && <p className="mt-1 text-sm text-red-600">{cityError}</p>}
      </div>

      <div className="md:col-span-2">
        <Button type="submit" size="lg" disabled={!canSubmit}>
          Kunden anlegen
        </Button>
      </div>
    </form>
  );
}
