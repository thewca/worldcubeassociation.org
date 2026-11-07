"use client";

import { useEffect, useState } from "react";

const DEFAULT_INTERVAL_MS = 1000;

/**
 * Re-runs `computeFn` on a timer, so that values derived from the current time (countdowns,
 * "has this deadline passed") stay truthful without the user reloading the page.
 */
export default function usePerpetualState<T>(
  computeFn: () => T,
  intervalMs = DEFAULT_INTERVAL_MS,
) {
  const [volatile, setVolatile] = useState(computeFn);

  useEffect(() => {
    const intervalId = setInterval(() => setVolatile(computeFn), intervalMs);

    return () => clearInterval(intervalId);
  }, [computeFn, intervalMs]);

  return volatile;
}
