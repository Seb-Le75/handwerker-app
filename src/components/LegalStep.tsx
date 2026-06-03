"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { SignaturePad } from "@/components/SignaturePad";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { LegalConsent } from "@/types";

type LegalStepProps = {
  value: LegalConsent;
  onChange: (value: LegalConsent) => void;
};

export function LegalStep({ value, onChange }: LegalStepProps) {
  const options = [
    { key: "privacyReceived", label: "Datenschutz erhalten", href: "/documents/datenschutz", document: "Datenschutzerklaerung" },
    { key: "cancellationReceived", label: "Widerruf erhalten", href: "/documents/widerruf", document: "Widerrufsbelehrung" },
    { key: "workStartApproved", label: "Zustimmung Arbeitsbeginn", href: "/documents/arbeitsbeginn", document: "Auftragsbeginn" }
  ] as const;

  return (
    <div className="grid gap-3">
      {options.map((option) => (
        <Label
          key={option.key}
          className="flex min-h-16 cursor-pointer items-center gap-4 rounded-md border bg-white px-4 py-3 shadow-sm"
        >
          <Checkbox
            checked={value[option.key]}
            onCheckedChange={(checked) => onChange({ ...value, [option.key]: checked === true })}
          />
          <span className="grid flex-1 gap-1">
            <span className="text-base">{option.label}</span>
            <Link
              href={option.href}
              target="_blank"
              className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-primary hover:underline"
              onClick={(event) => event.stopPropagation()}
            >
              {option.document} oeffnen
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </span>
        </Label>
      ))}
      <Label className="flex min-h-16 cursor-pointer items-center gap-4 rounded-md border border-primary/30 bg-primary/5 px-4 py-3 shadow-sm">
        <Checkbox
          checked={value.customerConsent === true}
          onCheckedChange={(checked) =>
            onChange({
              ...value,
              customerConsent: checked === true,
              consentDeclined: checked === true ? false : value.consentDeclined
            })
          }
        />
        <span className="grid gap-1">
          <span className="text-base">Kunde ist einverstanden und stimmt zu</span>
          <span className="text-sm font-normal text-muted-foreground">
            Der Kunde bestaetigt die rechtlichen Hinweise, die Zustimmung zum Arbeitsbeginn und die Auftragserfassung.
          </span>
        </span>
      </Label>

      <SignaturePad
        value={value.signatureDataUrl ?? ""}
        onChange={(signatureDataUrl) => onChange({ ...value, signatureDataUrl })}
      />

      <Label className="flex min-h-16 cursor-pointer items-center gap-4 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 shadow-sm">
        <Checkbox
          checked={value.consentDeclined === true}
          onCheckedChange={(checked) =>
            onChange({
              ...value,
              consentDeclined: checked === true,
              customerConsent: checked === true ? false : value.customerConsent
            })
          }
        />
        <span className="grid gap-1">
          <span className="text-base">Kunde stimmt nicht zu</span>
          <span className="text-sm font-normal text-muted-foreground">
            Ohne Zustimmung wird der Auftrag an dieser Stelle beendet.
          </span>
        </span>
      </Label>
    </div>
  );
}
