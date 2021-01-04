import { useState, useEffect } from 'react';

/**
 * Returns the persisted value and if the given value doesn't change
 * for the specified number of milliseconds the persisted value
 * is set to the given value.
 */
export default function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);

  return debouncedValue;
}
