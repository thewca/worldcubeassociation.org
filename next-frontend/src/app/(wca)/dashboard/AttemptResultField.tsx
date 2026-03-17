"use client";

import {
  Field,
  Fieldset,
  GridItem,
  Group,
  Input,
  SimpleGrid,
  useControllableState,
} from "@chakra-ui/react";
import useInputMask, {
  KeyShortcut,
  useDraftState,
  useKeyShortcutHandler,
} from "@/lib/hooks/useInputMask";
import _ from "lodash";
import {
  DNF_VALUE,
  DNS_VALUE,
  centisecondsToClockFormat,
  MultiBldResult,
  decodeMbldResult,
  SKIPPED_VALUE,
  encodeMbldResult,
} from "@/lib/wca/wcif/attempts";
import type { FormEvent } from "react";
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

function attemptResultToInput(number: number) {
  if (number === SKIPPED_VALUE) return "";
  if (number === DNF_VALUE) return "DNF";
  if (number === DNS_VALUE) return "DNS";

  return centisecondsToClockFormat(number);
}

function inputToNumber(input: string): number {
  if (input === "") return SKIPPED_VALUE;
  if (input === "DNF") return DNF_VALUE;
  if (input === "DNS") return DNS_VALUE;

  return stringToInt(input);
}

function numberToInput(number: number) {
  if (number === SKIPPED_VALUE) return "";
  if (number === DNF_VALUE) return "DNF";
  if (number === DNS_VALUE) return "DNS";

  return number.toString();
}

function reformatTimeInput(input: string) {
  const number = stringToInt(input);
  if (number === SKIPPED_VALUE) return "";

  const str = `00000000${number.toString().slice(0, 8)}`;
  const [, hh, mm, ss, cc] = str.match(/(\d\d)(\d\d)(\d\d)(\d\d)$/)!;
  return `${hh}:${mm}:${ss}.${cc}`.replace(/^[0:]*(?!\.)/g, "");
}

function reformatNumberInput(input: string, maxClamp: number = Infinity) {
  const parsedNumber = stringToInt(input);
  if (parsedNumber === SKIPPED_VALUE) return "";

  return Math.min(parsedNumber, maxClamp).toString();
}

const resultShortcuts: KeyShortcut<string>[] = [
  { keyTriggers: DNF_KEYS, draftValue: "DNF" },
  { keyTriggers: DNS_KEYS, draftValue: "DNS" },
];

export interface AttemptResultProps {
  value: number;
  onChange: (value: number) => void;
}

export function TimeField({ value, onChange }: AttemptResultProps) {
  const { isValid, binding } = useInputMask({
    value,
    onChange,
    defaultValue: SKIPPED_VALUE,
    parse: inputToAttemptResult,
    format: attemptResultToInput,
    applyMask: reformatTimeInput,
    shortcuts: resultShortcuts,
  });

  return (
    <Field.Root invalid={!isValid}>
      <Field.Label>Attempt</Field.Label>
      <Input spellCheck={false} {...binding} />
    </Field.Root>
  );
}

export function FmMovesField({
  value,
  onChange,
  resultType,
}: {
  resultType: "single" | "average";
} & AttemptResultProps) {
  const isAverage = resultType === "average";

  const maskedValue = isAverage ? value / 100 : value;
  const onMaskedChange = (value: number) =>
    onChange(isAverage ? value * 100 : value);

  const { isValid, binding } = useInputMask({
    value: maskedValue,
    onChange: onMaskedChange,
    defaultValue: 0,
    parse: inputToNumber,
    format: numberToInput,
    applyMask: reformatNumberInput,
    shortcuts: resultShortcuts,
  });

  return (
    <Field.Root invalid={!isValid}>
      <Field.Label>PointsField (isAverage: {isAverage.toString()})</Field.Label>
      <Input spellCheck={false} {...binding} />
      <Field.HelperText>{value}</Field.HelperText>
    </Field.Root>
  );
}

export function MbldCubesField({ value, onChange }: AttemptResultProps) {
  const { isValid, binding } = useInputMask({
    value,
    onChange,
    defaultValue: 0,
    parse: inputToNumber,
    format: numberToInput,
    applyMask: (input) => reformatNumberInput(input, 99),
  });

  return (
    <Field.Root invalid={!isValid}>
      <Field.Label>CubesField</Field.Label>
      <Input spellCheck={false} {...binding} />
      <Field.HelperText>{value}</Field.HelperText>
    </Field.Root>
  );
}

export function MbldField({ value, onChange }: AttemptResultProps) {
  const [draft, setDraft] = useDraftState(value, decodeMbldResult);

  const handleChange = (payload: Partial<MultiBldResult>) => {
    const patchedResult = {
      ...draft,
      ...payload,
    };

    setDraft(patchedResult);
    const encodedResult = encodeMbldResult(patchedResult);

    if (encodedResult !== value) {
      onChange(encodedResult);
    }
  };

  const shortcutHandler = useKeyShortcutHandler(resultShortcuts);

  const captureShortcuts = (e: FormEvent<HTMLFieldSetElement>) => {
    const usedShortcut = shortcutHandler(e.nativeEvent);

    if (usedShortcut) {
      const shortcutTime = inputToAttemptResult(usedShortcut.draftValue);
      onChange(shortcutTime);

      e.stopPropagation();
      e.preventDefault();
    }
  };

  return (
    <Fieldset.Root onChangeCapture={captureShortcuts}>
      <Fieldset.Legend>MbldField</Fieldset.Legend>
      <Fieldset.Content>
        <SimpleGrid columns={16} asChild>
          <Group attached>
            <GridItem colSpan={3}>
              <MbldCubesField
                value={draft.solved}
                onChange={(solved) => handleChange({ solved })}
              />
            </GridItem>
            <GridItem colSpan={3}>
              <MbldCubesField
                value={draft.attempted}
                onChange={(attempted) => handleChange({ attempted })}
              />
            </GridItem>
            <GridItem colSpan={10}>
              <TimeField
                value={draft.timeCentiseconds!}
                onChange={(timeCentiseconds) =>
                  handleChange({ timeCentiseconds })
                }
              />
            </GridItem>
          </Group>
        </SimpleGrid>
      </Fieldset.Content>
      <Fieldset.HelperText>
        {JSON.stringify(decodeMbldResult(value))}
      </Fieldset.HelperText>
    </Fieldset.Root>
  );
}

export interface AttemptResultFieldProps extends Partial<AttemptResultProps> {
  eventId: EventId;
  resultType: "single" | "average";
}

function AttemptResultField({
  value,
  onChange,
  eventId,
  resultType,
}: AttemptResultFieldProps) {
  const [componentValue, setComponentValue] = useControllableState({
    value,
    onChange,
    defaultValue: SKIPPED_VALUE,
  });

  if (eventId === "333fm") {
    return (
      <FmMovesField
        value={componentValue}
        onChange={setComponentValue}
        resultType={resultType}
      />
    );
  }

  if (eventId === "333mbf" || eventId === "333mbo") {
    return <MbldField value={componentValue} onChange={setComponentValue} />;
  }

  return <TimeField value={componentValue} onChange={setComponentValue} />;
}

export default AttemptResultField;
