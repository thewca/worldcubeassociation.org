import { Format } from "@/lib/wca/data/formats";
import { statColumnsForFormat } from "@/lib/live/statColumnsForFormat";
import { LiveResult } from "@/types/live";

export const orderResults = (results: LiveResult[], format: Format) => {
  const stats = statColumnsForFormat(format);

  const rankBy = stats[0].field;
  const secondaryRankBy = stats[1]?.field;

  // When rankBy is invalid (≤ 0) and a secondaryRankBy exists, fall back to
  // secondaryRankBy so e.g. incomplete (average=0, best=39) ranks above DNF mean
  // (average=-1, best=40) — both have invalid averages so rank only by best single.
  const effectiveSortKey = (result: LiveResult) => {
    if (result[rankBy] <= 0 && secondaryRankBy) return result[secondaryRankBy];
    return result[rankBy];
  };

  const sortedResults = results.toSorted((a, b) => {
    const aInvalid = a[rankBy] <= 0;
    const bInvalid = b[rankBy] <= 0;

    if (aInvalid !== bInvalid) {
      return aInvalid ? 1 : -1;
    }

    // Both have invalid primary. Results where the secondary is also invalid
    // (all DNF/DNS, no valid single) rank after those with a valid secondary.
    if (aInvalid && secondaryRankBy) {
      const aSecondaryInvalid = a[secondaryRankBy] <= 0;
      const bSecondaryInvalid = b[secondaryRankBy] <= 0;
      if (aSecondaryInvalid !== bSecondaryInvalid) {
        return aSecondaryInvalid ? 1 : -1;
      }
    }

    const aPrimary = effectiveSortKey(a);
    const bPrimary = effectiveSortKey(b);

    if (aPrimary !== bPrimary) {
      return aPrimary - bPrimary;
    }

    if (secondaryRankBy) {
      const aSecondaryInvalid = a[secondaryRankBy] <= 0;
      const bSecondaryInvalid = b[secondaryRankBy] <= 0;

      if (aSecondaryInvalid !== bSecondaryInvalid) {
        return aSecondaryInvalid ? 1 : -1;
      }

      return a[secondaryRankBy] - b[secondaryRankBy];
    }
    // Sort by registration id as a fallback
    return a.registration_id - b.registration_id;
  });

  return sortedResults.reduce<(LiveResult & { global_pos: number })[]>(
    (acc, result, index) => {
      if (index === 0) {
        return [...acc, { ...result, global_pos: 1 }];
      }

      const prev = acc[index - 1];

      const isTied =
        effectiveSortKey(result) === effectiveSortKey(prev) &&
        (!secondaryRankBy || result[secondaryRankBy] === prev[secondaryRankBy]);

      return [
        ...acc,
        { ...result, global_pos: isTied ? prev.global_pos : index + 1 },
      ];
    },
    [],
  );
};
