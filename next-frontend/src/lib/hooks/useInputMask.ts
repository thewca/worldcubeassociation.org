import { useCallback, useMemo, useState } from "react";
import { useControllableState } from "@chakra-ui/react";

import type { ChangeEvent, ChangeEventHandler, FocusEventHandler } from "react";

interface InputMaskOptions<T, M extends string = string> {
  value?: T;
  onChange?: (value: T) => void;
  defaultValue: T;
  parse: (input: M) => T;
  format: (value: T) => M;
  preprocess?: (input: string, event: ChangeEvent<HTMLInputElement>) => string;
  applyMask: (input: string) => M;
}

type InputChangeHandler = ChangeEventHandler<HTMLInputElement>;
type InputBlurHandler = FocusEventHandler<HTMLInputElement>;

interface InputMaskBinding {
  value: string;
  onChange: InputChangeHandler;
  onBlur: InputBlurHandler;
}

interface InputMaskReturn {
  displayValue: string;
  isValid: boolean;
  binding: InputMaskBinding;
}

export default function useInputMask<T, M extends string = string>({
  value: controlledValue,
  onChange,
  defaultValue,
  parse,
  format,
  preprocess,
  applyMask,
}: InputMaskOptions<T, M>): InputMaskReturn {
  const [dataValue, setDataValue] = useControllableState({
    value: controlledValue,
    defaultValue,
    onChange,
  });

  const displayValue = useMemo(() => format(dataValue), [dataValue, format]);

  const [draft, setDraft] = useState(displayValue);
  const [isValid, setIsValid] = useState(true);

  // This state exists only for tracking external prop changes to `dataValue`.
  // Consider the following scenario:
  //   1. The user enters a (valid) input. It gets saved in the `draft` state.
  //   2. The user leaves the field. The `draft` is communicated to `dataValue` via `onBlur`.
  //   3. An external system sets `dataValue` to a new state.
  // Problem in this scenario: The internal `draft` state is not affected by the change from (3)
  //   The solution is to track external changes via a "buffer state".
  // This avoids `useEffect` as per the official instructions by the React folks themselves:
  //   https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevDataValue, setPrevDataValue] = useState(dataValue);

  if (dataValue !== prevDataValue) {
    setPrevDataValue(dataValue);
    const formatted = format(dataValue);

    if (draft != formatted) {
      setDraft(formatted);
    }
  }

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;

      const preprocessed = preprocess?.(raw, e) ?? raw;
      const aligned = applyMask(preprocessed);

      setDraft(aligned);
    },
    [preprocess, applyMask, setDraft],
  );

  const handleBlur = useCallback(() => {
    const parsed = parse(draft);
    const reFormatted = format(parsed);

    const isDraftValid = draft === reFormatted;
    setIsValid(isDraftValid);

    if (isDraftValid) {
      setDataValue(parsed);
    } else {
      const defaultDraft = format(defaultValue);
      setDraft(defaultDraft);
    }
  }, [draft, parse, format, defaultValue, setDataValue]);

  const bindDraft = useMemo(
    () => ({
      value: draft,
      onChange: handleChange,
      onBlur: handleBlur,
    }),
    [draft, handleChange, handleBlur],
  );

  return { displayValue: draft, isValid, binding: bindDraft };
}
