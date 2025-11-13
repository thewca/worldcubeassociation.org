import { useCallback, useMemo, useState } from "react";
import { useControllableState } from "@chakra-ui/react";

import type {
  Dispatch,
  SetStateAction,
  ChangeEvent,
  ChangeEventHandler,
} from "react";

type InputMaskFormatter<T> = {
  parse: (input: string) => T;
  format: (value: T) => string;
  preprocess?: (input: string, event?: ChangeEvent<HTMLInputElement>) => string;
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

type InputMaskReturn<T> = {
  state: [T, Dispatch<SetStateAction<T>>];
  binding: {
    value: string;
    onChange: InputChangeHandler;
  };
};

export default function useInputMask<T>({
  value: controlledValue,
  onChange,
  defaultValue,
  parse,
  format,
  preprocess,
}: InputMaskOptions<T>): InputMaskReturn<T> {
  const [value, setValue] = useControllableState({
    value: controlledValue,
    defaultValue,
    onChange,
  });

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;

      const preprocessed = preprocess?.(raw, e) ?? raw;
      const parsed = parse(preprocessed);

      setValue(parsed);
    },
    [parse, preprocess, setValue],
  );

  const displayValue = useMemo(() => format(value), [value, format]);

  const binding = useMemo(
    () => ({ value: displayValue, onChange: handleChange }),
    [displayValue, handleChange],
  );

  return {
    state: [value, setValue],
    binding,
  };
}

export function useDraftedInputMask<T>(options: InputMaskOptions<T>) {
  const { state, binding } = useInputMask(options);

  const [value, setValue] = state;
  const [draft, setDraft] = useState(binding.value);

  // Sync Draft wenn extern value geändert wird (ohne useEffect!)
  if (draft !== binding.value) setDraft(binding.value);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setDraft(e.target.value),
    [setDraft],
  );

  const handleBlur = useCallback(() => {
    const parsed = options.parse(draft);
    const reFormatted = options.format(parsed);

    // Nur committen, wenn roundtrip gültig ist
    if (draft === reFormatted) {
      setValue(parsed);
    } else {
      // Falls ungültig → normalize, aber kein commit
      setDraft(reFormatted);
    }
  }, [draft, options, setValue]);

  const bindDraft = useMemo(
    () => ({
      value: draft,
      onChange: handleChange,
      onBlur: handleBlur,
      spellCheck: false,
    }),
    [draft, handleChange, handleBlur],
  );

  return { value, setValue, bind: bindDraft };
}
