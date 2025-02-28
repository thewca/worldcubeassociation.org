import { useEffect, useState } from 'react';

export default function usePerpetualState(computeFn, intervalMs = 1000) {
  const [volatile, setVolatile] = useState(computeFn);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setVolatile(computeFn);
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [computeFn, intervalMs]);

  return volatile;
}
