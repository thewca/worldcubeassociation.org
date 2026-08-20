import { useState, useEffect } from "react";

/**
 * Returns the persisted value and if the given value doesn't change
 * for the specified number of milliseconds the persisted value
 * is set to the given value.
 */
export default function useDebounce<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), delay);

    return () => clearTimeout(timeout);
  }, [value, delay]);

  return debouncedValue;
}
