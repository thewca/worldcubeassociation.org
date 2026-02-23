import { useCallback, useInsertionEffect, useRef } from "react";

// TODO: remove once released in React. Also remove the result of
// useEffectEvent from useEffect deps in all places using it, since
// it will no longer warn.

/**
 * Polyfill for the experimental useEffectEvent [1].
 *
 * [1]: https://react.dev/learn/separating-events-from-effects
 */
export default function useEffectEvent<T extends unknown[], U>(
  callback: (...args: T) => U,
): typeof callback {
  const ref = useRef<typeof callback | null>(null);

  useInsertionEffect(() => {
    ref.current = callback;
  }, [callback]);

  return useCallback((...args: T) => {
    const latestFn = ref.current!;
    return latestFn(...args);
  }, []);
}
