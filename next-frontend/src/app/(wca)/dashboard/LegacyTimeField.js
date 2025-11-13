"use client";

import { useState, useCallback } from "react";
import { Field, Input } from "@chakra-ui/react";
import _ from "lodash";

const DNF_KEYS = ["d", "D", "/"];
const DNS_KEYS = ["s", "S", "*"];

const SKIPPED_VALUE = 0;
const DNF_VALUE = -1;
const DNS_VALUE = -2;

function centisecondsToClockFormat(centiseconds) {
  if (centiseconds == null) {
    return "?:??:??";
  }

  if (!Number.isFinite(centiseconds)) {
    throw new Error(
      `Invalid centiseconds, expected positive number, got ${centiseconds}.`,
    );
  }

  return new Date(centiseconds * 10)
    .toISOString()
    .substr(11, 11)
    .replace(/^[0:]*(?!\.)/g, "");
}

function inputToAttemptResult(input) {
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

function attemptResultToInput(attemptResult) {
  if (attemptResult === SKIPPED_VALUE) return "";
  if (attemptResult === DNF_VALUE) return "DNF";
  if (attemptResult === DNS_VALUE) return "DNS";

  return centisecondsToClockFormat(attemptResult);
}

function isValid(input) {
  return input === attemptResultToInput(inputToAttemptResult(input));
}

function reformatInput(input) {
  const number = _.toInteger(input.replace(/\D/g, "")) || 0;

  return attemptResultToInput(number);
}

/* eslint react/jsx-props-no-spreading: "off" */
function TimeField({ value, onChange, disabled }) {
  const [prevValue, setPrevValue] = useState(value);
  const [draftInput, setDraftInput] = useState(attemptResultToInput(value));

  // Sync draft value when the upstream value changes.
  // See AttemptResultField for detailed description.
  if (prevValue !== value) {
    setDraftInput(attemptResultToInput(value));
    setPrevValue(value);
  }

  const handleChange = useCallback(
    (event) => {
      const key = event.nativeEvent.data;
      if (DNF_KEYS.includes(key)) {
        setDraftInput("DNF");
      } else if (DNS_KEYS.includes(key)) {
        setDraftInput("DNS");
      } else {
        setDraftInput(reformatInput(event.target.value));
      }
    },
    [setDraftInput],
  );

  const handleBlur = useCallback(() => {
    const attempt = isValid(draftInput)
      ? inputToAttemptResult(draftInput)
      : SKIPPED_VALUE;

    onChange(attempt);

    // Once we emit the change, reflect the initial state.
    setDraftInput(attemptResultToInput(value));
  }, [draftInput, onChange, setDraftInput, value]);

  return (
    <Input
      disabled={disabled}
      spellCheck={false}
      value={draftInput}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
}

export default function TimeFieldWrapper({ disabled = false }) {
  const [value, onChange] = useState();

  return (
    <Field.Root>
      <Field.Label>I am the legacy field</Field.Label>
      <TimeField value={value} onChange={onChange} disabled={disabled} />
      <Field.HelperText>{value}</Field.HelperText>
    </Field.Root>
  );
}
