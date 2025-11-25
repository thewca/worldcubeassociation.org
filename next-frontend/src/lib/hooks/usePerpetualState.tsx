import { useEffect, useState } from "react";

export default function usePerpetualState<T>(
  computeFn: (prev?: T) => T,
  intervalMs = 1000,
) {
  const [volatile, setVolatile] = useState<T>(computeFn);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setVolatile(computeFn);
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [computeFn, intervalMs]);

  return volatile;
}
