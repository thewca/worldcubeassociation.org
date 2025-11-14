"use client";

import { type ChangeEvent, useState } from "react";
import { Field, Input } from "@chakra-ui/react";
import { useDraftedInputMask } from "@/lib/hooks/useInputMask";
import _ from "lodash";
import {
  DNF_VALUE,
  DNS_VALUE,
  formatAttemptResult,
  SKIPPED_VALUE,
} from "@/lib/wca/wcif/attempts";

export const DNF_KEYS = ["d", "D", "/"];
export const DNS_KEYS = ["s", "S", "*"];

function inputToAttemptResult(input: string) {
  if (input === "") return SKIPPED_VALUE;
  if (input === "DNF") return DNF_VALUE;
  if (input === "DNS") return DNS_VALUE;

  const num = _.toInteger(input.replace(/\D/g, "")) || 0;

  return (
    Math.floor(num / 1000000) * 360000 +
    Math.floor((num % 1000000) / 10000) * 6000 +
    Math.floor((num % 10000) / 100) * 100 +
    (num % 100)
  );
}

function reformatInput(input: string) {
  if (input === "DNF" || input === "DNS") {
    return input;
  }

  const number = _.toInteger(input.replace(/\D/g, "")) || 0;
  if (number === 0) return "";

  const str = `00000000${number.toString().slice(0, 8)}`;
  const [, hh, mm, ss, cc] = str.match(/(\d\d)(\d\d)(\d\d)(\d\d)$/)!;
  return `${hh}:${mm}:${ss}.${cc}`.replace(/^[0:]*(?!\.)/g, "");
}

function preprocessShortcuts(
  input: string,
  event: ChangeEvent<HTMLInputElement>,
) {
  const nativeEvent = event.nativeEvent;

  if (nativeEvent instanceof InputEvent) {
    const key = nativeEvent.data || "";

    if (DNF_KEYS.includes(key)) {
      return "DNF";
    } else if (DNS_KEYS.includes(key)) {
      return "DNS";
    }
  }

  return input;
}

export function TimeField() {
  const [value, setValue] = useState(0);

  const { isValid, binding } = useDraftedInputMask({
    value,
    onChange: setValue,
    defaultValue: 0,
    parse: inputToAttemptResult,
    format: (centis) => formatAttemptResult(centis, "333"),
    preprocess: preprocessShortcuts,
    realign: reformatInput,
  });

  return (
    <Field.Root invalid={!isValid}>
      <Field.Label>I am the cool new kid on the block!</Field.Label>
      <Input spellCheck={false} {...binding} />
      <Field.HelperText>{value}</Field.HelperText>
    </Field.Root>
  );
}

export default TimeField;
