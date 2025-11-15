"use client";

import { useState } from "react";
import {Box, Button, Field, Input} from "@chakra-ui/react";
import useInputMask from "@/lib/hooks/useInputMask";
import _ from "lodash";
import {
  DNF_VALUE,
  DNS_VALUE,
  formatAttemptResult,
  SKIPPED_VALUE,
} from "@/lib/wca/wcif/attempts";
import type { ChangeEvent } from "react";
import type { EventId } from "@/lib/wca/data/events";

export const DNF_KEYS = ["d", "D", "/"];
export const DNS_KEYS = ["s", "S", "*"];

function stringToInt(numeric: string) {
  return _.toInteger(numeric.replace(/\D/g, "")) || SKIPPED_VALUE;
}

function inputToAttemptResult(input: string) {
  if (input === "") return SKIPPED_VALUE;
  if (input === "DNF") return DNF_VALUE;
  if (input === "DNS") return DNS_VALUE;

  const num = stringToInt(input);

  return (
    Math.floor(num / 1000000) * 360000 +
    Math.floor((num % 1000000) / 10000) * 6000 +
    Math.floor((num % 10000) / 100) * 100 +
    (num % 100)
  );
}

function inputToPoints(input: string): number {
  if (input === "") return SKIPPED_VALUE;
  if (input === "DNF") return DNF_VALUE;
  if (input === "DNS") return DNS_VALUE;

  return stringToInt(input);
}

function numberToInput(number: number) {
  if (number === SKIPPED_VALUE) return '';
  if (number === DNF_VALUE) return 'DNF';
  if (number === DNS_VALUE) return 'DNS';

  return number.toString();
}

function reformatTimeInput(input: string) {
  if (input === "DNF" || input === "DNS") {
    return input;
  }

  const number = stringToInt(input);
  if (number === SKIPPED_VALUE) return "";

  const str = `00000000${number.toString().slice(0, 8)}`;
  const [, hh, mm, ss, cc] = str.match(/(\d\d)(\d\d)(\d\d)(\d\d)$/)!;
  return `${hh}:${mm}:${ss}.${cc}`.replace(/^[0:]*(?!\.)/g, "");
}

function reformatNumberInput(input: string) {
  if (input === "DNF" || input === "DNS") {
    return input;
  }

  const parsedNumber = stringToInt(input);

  if (parsedNumber === SKIPPED_VALUE) return "";
  return parsedNumber.toString();
}

function reformatAndClampNumberInput(input: string, maxValue: number) {
  if (input === "DNF" || input === "DNS") {
    return input;
  }

  const parsedNumber = stringToInt(input);

  if (parsedNumber === SKIPPED_VALUE) return "";
  return Math.min(parsedNumber, maxValue).toString();
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

export function TimeField({ eventId }: { eventId: EventId }) {
  const [value, setValue] = useState(0);

  const { isValid, binding } = useInputMask({
    value,
    onChange: setValue,
    defaultValue: 0,
    parse: inputToAttemptResult,
    format: (centis) => formatAttemptResult(centis, eventId),
    preprocess: preprocessShortcuts,
    applyMask: reformatTimeInput,
  });

  return (
    <Field.Root invalid={!isValid}>
      <Field.Label>TimeField</Field.Label>
      <Input spellCheck={false} {...binding} />
      <Field.HelperText>{value}</Field.HelperText>
    </Field.Root>
  );
}

export function FmMovesField({ resultType }: {
  resultType: "single" | "average";
}) {
  const [rawValue, setRawValue] = useState(0);

  const isAverage = resultType === 'average';

  const value = isAverage ? rawValue / 100 : rawValue;
  const setValue = (value: number) => setRawValue(isAverage ? value * 100 : value);

  const { isValid, binding } = useInputMask({
    value,
    onChange: setValue,
    defaultValue: 0,
    parse: inputToPoints,
    format: numberToInput,
    preprocess: preprocessShortcuts,
    applyMask: reformatNumberInput,
  });

  return (
    <Field.Root invalid={!isValid}>
      <Field.Label>PointsField (isAverage: {isAverage.toString()})</Field.Label>
      <Input spellCheck={false} {...binding} />
      <Field.HelperText>{rawValue}</Field.HelperText>
    </Field.Root>
  );
}

export function MbldCubesField() {
  const [value, setValue] = useState(0);

  const { isValid, binding } = useInputMask({
    value,
    onChange: setValue,
    defaultValue: 0,
    parse: inputToPoints,
    format: numberToInput,
    preprocess: preprocessShortcuts,
    applyMask: (input) => reformatAndClampNumberInput(input, 99),
  });

  return (
    <Field.Root invalid={!isValid}>
      <Field.Label asChild>
        <Box gap={4}>
          CubesField
          <Button onClick={() => setValue(42)}>Set to 42</Button>
        </Box>
      </Field.Label>
      <Input spellCheck={false} {...binding} />
      <Field.HelperText>{value}</Field.HelperText>
    </Field.Root>
  );
}

function AttemptResultField({ eventId, resultType }: {
  eventId: EventId;
  resultType: "single" | "average";
}) {

}

export default AttemptResultField;
