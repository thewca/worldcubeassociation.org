import { useMemo } from "react";
import useOrderedSet from "./useOrderedSet";

/**
 * Maintains a set, and also provides it as an array without duplicates.
 * The array's current implementation maintains order, but this is not
 * guaranteed.
 */
export default function useSet<T>(initialSet: Iterable<T> = new Set<T>()) {
  const orderedSet = useOrderedSet([...initialSet]);

  const asSet = useMemo(
    () => new Set(orderedSet.asArray),
    [orderedSet.asArray],
  );

  return { asSet, ...orderedSet };
}
