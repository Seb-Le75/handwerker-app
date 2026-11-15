"use client";

import { useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";

type DecimalInputProps = {
  value: number;
  onChange: (value: number) => void;
  ariaLabel: string;
  maximumFractionDigits?: number;
};

export function DecimalInput({ value, onChange, ariaLabel, maximumFractionDigits = 3 }: DecimalInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [text, setText] = useState(() => formatDecimal(value, maximumFractionDigits));

  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setText(formatDecimal(value, maximumFractionDigits));
    }
  }, [maximumFractionDigits, value]);

  return (
    <Input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      aria-label={ariaLabel}
      value={text}
      onFocus={(event) => event.currentTarget.select()}
      onChange={(event) => {
        const next = event.target.value.replace(".", ",");
        const pattern = new RegExp(`^\\d*(?:,\\d{0,${maximumFractionDigits}})?$`);
        if (!pattern.test(next)) return;
        setText(next);
        const parsed = Number(next.replace(",", "."));
        if (next !== "" && next !== "," && Number.isFinite(parsed)) onChange(parsed);
      }}
      onBlur={() => {
        const parsed = Number(text.replace(",", "."));
        const nextValue = Number.isFinite(parsed) ? parsed : 0;
        onChange(nextValue);
        setText(formatDecimal(nextValue, maximumFractionDigits));
      }}
    />
  );
}

function formatDecimal(value: number, maximumFractionDigits: number) {
  return new Intl.NumberFormat("de-DE", {
    useGrouping: false,
    minimumFractionDigits: 0,
    maximumFractionDigits
  }).format(value);
}
