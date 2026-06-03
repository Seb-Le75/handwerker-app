"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Acceptance } from "@/types";

type AcceptanceStepProps = {
  value: Acceptance;
  onChange: (value: Acceptance) => void;
};

export function AcceptanceStep({ value, onChange }: AcceptanceStepProps) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-2">
        <Label className="flex min-h-16 cursor-pointer items-center gap-4 rounded-md border bg-white px-4 py-3 shadow-sm">
          <Checkbox
            checked={value.serviceCompleted === true}
            onCheckedChange={(checked) => onChange({ ...value, serviceCompleted: checked === true })}
          />
          <span className="text-base">Leistung erbracht</span>
        </Label>
        <Label className="flex min-h-16 cursor-pointer items-center gap-4 rounded-md border bg-white px-4 py-3 shadow-sm">
          <Checkbox
            checked={value.systemFunctional === true}
            onCheckedChange={(checked) => onChange({ ...value, systemFunctional: checked === true })}
          />
          <span className="text-base">Anlage funktionsfaehig</span>
        </Label>
      </div>

      <div className="grid gap-3 rounded-lg border bg-white p-4 shadow-sm">
        <Label className="flex min-h-12 cursor-pointer items-center gap-4">
          <Checkbox
            checked={value.repairNotPossible === true}
            onCheckedChange={(checked) =>
              onChange({
                ...value,
                repairNotPossible: checked === true,
                systemFunctional: checked === true ? false : value.systemFunctional
              })
            }
          />
          <span className="text-base">Anlage konnte nicht repariert werden</span>
        </Label>
        {value.repairNotPossible === true && (
          <div className="space-y-2">
            <Label htmlFor="repairNotPossibleReason">Bemerkung</Label>
            <Textarea
              id="repairNotPossibleReason"
              value={value.repairNotPossibleReason ?? ""}
              onChange={(event) => onChange({ ...value, repairNotPossibleReason: event.target.value })}
              placeholder="Warum war eine Reparatur nicht moeglich?"
            />
          </div>
        )}
      </div>

      <Label className="flex min-h-16 cursor-pointer items-center gap-4 rounded-md border border-primary/30 bg-primary/5 px-4 py-3 shadow-sm">
        <Checkbox
          checked={value.customerConfirmed === true}
          onCheckedChange={(checked) => onChange({ ...value, customerConfirmed: checked === true })}
        />
        <span className="grid gap-1">
          <span className="text-base">Kunde bestaetigt die Abnahme</span>
          <span className="text-sm font-normal text-muted-foreground">
            Die Angaben zur Leistung, Funktion und gegebenenfalls zur nicht moeglichen Reparatur wurden mit dem Kunden
            besprochen.
          </span>
        </span>
      </Label>
    </div>
  );
}
