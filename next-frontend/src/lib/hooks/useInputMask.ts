import { useCallback, useMemo, useState } from "react";
import { useControllableState } from "@chakra-ui/react";

import type { ChangeEvent, ChangeEventHandler, FocusEventHandler } from "react";

type InputMaskFormatter<T> = {
  parse: (input: string) => T;
  format: (value: T) => string;
  preprocess?: (input: string, event: ChangeEvent<HTMLInputElement>) => string;
};

type InputMaskControlled<T> = {
  value: T;
  onChange: (value: T) => void;
  defaultValue?: T;
};

type InputMaskUncontrolled<T> = {
  value: never;
  onChange: never;
  defaultValue: T;
};

type InputMaskOptions<T> = (InputMaskControlled<T> | InputMaskUncontrolled<T>) &
  InputMaskFormatter<T>;

type InputChangeHandler = ChangeEventHandler<HTMLInputElement>;

type InputMaskBinding = {
  value: string;
  onChange: InputChangeHandler;
};

type InputMaskReturn<B extends InputMaskBinding> = {
  displayValue: string;
  binding: B;
};

export default function useInputMask<T>({
  value: controlledValue,
  onChange,
  defaultValue,
  parse,
  format,
  preprocess,
}: InputMaskOptions<T>): InputMaskReturn<InputMaskBinding> {
  const [dataValue, setDataValue] = useControllableState({
    value: controlledValue,
    defaultValue,
    onChange,
  });

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;

      const preprocessed = preprocess?.(raw, e) ?? raw;
      const parsed = parse(preprocessed);

      setDataValue(parsed);
    },
    [parse, preprocess, setDataValue],
  );

  const displayValue = useMemo(() => format(dataValue), [dataValue, format]);

  const binding = useMemo(
    () => ({ value: displayValue, onChange: handleChange }),
    [displayValue, handleChange],
  );

  return { displayValue, binding };
}

type InputMaskDraftOptions<T> = InputMaskOptions<T> & {
  defaultValue: T;
  realign: (input: string) => string;
};

type InputBlurHandler = FocusEventHandler<HTMLInputElement>;

type InputMaskDraftBinding = InputMaskBinding & {
  onBlur: InputBlurHandler;
};

type InputMaskDraftReturn = InputMaskReturn<InputMaskDraftBinding> & {
  isValid: boolean;
};

export function useDraftedInputMask<T>({
  value: controlledValue,
  onChange,
  defaultValue,
  parse,
  format,
  preprocess,
  realign,
}: InputMaskDraftOptions<T>): InputMaskDraftReturn {
  const [dataValue, setDataValue] = useControllableState({
    value: controlledValue,
    defaultValue,
    onChange,
  });

  const displayValue = useMemo(() => format(dataValue), [dataValue, format]);

  const [draft, setDraft] = useState(displayValue);
  const [isValid, setIsValid] = useState(true);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;

      const preprocessed = preprocess?.(raw, e) ?? raw;
      const aligned = realign(preprocessed);

      setDraft(aligned);
    },
    [preprocess, realign, setDraft],
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
