"use client";

import { useCallback } from "react";
import { Field, Input, useControllableState } from "@chakra-ui/react";

export const SKIPPED_VALUE = 0;
export const DNF_VALUE = -1;
export const DNS_VALUE = -2;
export const DNF_KEYS = ["d", "D", "/"] as const;
export const DNS_KEYS = ["s", "S", "*"] as const;

// ----------------------------------------------------
// 1️⃣ Parsing: Eingabetext -> Zentisekunden
// ----------------------------------------------------
function parseTimeInput(input: string): number {
  if (!input) return SKIPPED_VALUE;
  if (input === "DNF") return DNF_VALUE;
  if (input === "DNS") return DNS_VALUE;

  // Nur Ziffern, maximal 8
  const digits = input.replace(/\D/g, "").slice(-8);
  if (!digits) return SKIPPED_VALUE;

  const padded = digits.padStart(8, "0");
  const hh = Number(padded.slice(0, 2));
  const mm = Number(padded.slice(2, 4));
  const ss = Number(padded.slice(4, 6));
  const cc = Number(padded.slice(6, 8));

  return hh * 360_000 + mm * 6_000 + ss * 100 + cc;
}

// ----------------------------------------------------
// 2️⃣ Formatierung: Zentisekunden -> formatiertes Display
// ----------------------------------------------------
function formatTimeValue(value: number): string {
  if (value === SKIPPED_VALUE) return "";
  if (value === DNF_VALUE) return "DNF";
  if (value === DNS_VALUE) return "DNS";

  const hours = Math.floor(value / 360_000);
  const remainderH = value % 360_000;
  const minutes = Math.floor(remainderH / 6_000);
  const remainderM = remainderH % 6_000;
  const seconds = Math.floor(remainderM / 100);
  const centis = remainderM % 100;

  const cc = String(centis).padStart(2, "0");

  if (hours > 0) {
    // Format: H:MM:SS.CC  (hours not zero — show hours and always pad minutes/seconds)
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${cc}`;
  }

  if (minutes > 0) {
    // Format: M:SS.CC  (no hours, show minutes as-is then seconds padded)
    return `${minutes}:${String(seconds).padStart(2, "0")}.${cc}`;
  }

  // Less than a minute: SS.CC or S.CC (seconds as number, centis padded)
  return `${seconds}.${cc}`;
}

// ----------------------------------------------------
// 3️⃣ Komponente (controllable/uncontrolled hybrid)
// ----------------------------------------------------
interface TimeFieldProps {
  value?: number; // Zentisekunden
  onChange?: (centiseconds: number) => void;
  defaultValue?: number;
  placeholder?: string;
  [key: string]: any;
}

export function TimeField({
                            value: valueProp,
                            onChange: onChangeProp,
                            defaultValue = SKIPPED_VALUE,
                            placeholder = "--.--",
                            ...rest
                          }: TimeFieldProps) {
  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue,
    onChange: onChangeProp,
  });

  const display = formatTimeValue(value);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const key = ((e.nativeEvent as InputEvent).data ?? "") as string;

      // Sonderkürzel zuerst prüfen
      if (DNF_KEYS.includes(key as any)) return setValue(DNF_VALUE);
      if (DNS_KEYS.includes(key as any)) return setValue(DNS_VALUE);

      // Overflow verhindern
      const digits = e.target.value.replace(/\D/g, "");
      if (digits.length > 8) return; // ignorieren

      const parsed = parseTimeInput(e.target.value);
      setValue(parsed);
    },
    [setValue]
  );

  return (
    <Field.Root>
      <Input
        spellCheck={false}
        textAlign="right"
        fontFamily="mono"
        placeholder={placeholder}
        value={display}
        onChange={handleChange}
        {...rest}
      />
      <Field.HelperText fontFamily="mono">
        {value === SKIPPED_VALUE ? "–" : `${value} cs`}
      </Field.HelperText>
    </Field.Root>
  );
}

export default TimeField;
