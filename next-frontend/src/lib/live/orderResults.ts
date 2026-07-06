import { Format } from "@/lib/wca/data/formats";
import { statColumnsForFormat } from "@/lib/live/statColumnsForFormat";
import { LiveResult } from "@/types/live";

export const orderResults = (
  results: LiveResult[],
  format: Format,
  forecastView = false,
) => {
  const stats = statColumnsForFormat(format);

  const rankBy = stats[0].field;
  const secondaryRankBy = stats[1]?.field;

  // In forecast view an incomplete average is stood in for by the
  // server-computed projected average (like wca-live's resultsForView).
  const statValue = (result: LiveResult, field: typeof rankBy) => {
    if (forecastView && field === "average" && result.average === 0) {
      const projected =
        "forecast_statistics" in result
          ? result.forecast_statistics?.projected_average
          : undefined;
      return projected ?? result.average;
    }
    return result[field];
  };

  // When rankBy is invalid (≤ 0) and a secondaryRankBy exists, fall back to
  // secondaryRankBy so e.g. incomplete (average=0, best=39) ranks above DNF mean
  // (average=-1, best=40) — both have invalid averages so rank only by best single.
  const effectiveSortKey = (result: LiveResult) => {
    if (statValue(result, rankBy) <= 0 && secondaryRankBy)
      return statValue(result, secondaryRankBy);
    return statValue(result, rankBy);
  };

  const sortedResults = results.toSorted((a, b) => {
    const aInvalid = statValue(a, rankBy) <= 0;
    const bInvalid = statValue(b, rankBy) <= 0;

    if (aInvalid !== bInvalid) {
      return aInvalid ? 1 : -1;
    }

    // Both have invalid primary. Results where the secondary is also invalid
    // (all DNF/DNS, no valid single) rank after those with a valid secondary.
    if (aInvalid && secondaryRankBy) {
      const aSecondaryInvalid = statValue(a, secondaryRankBy) <= 0;
      const bSecondaryInvalid = statValue(b, secondaryRankBy) <= 0;
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
      const aSecondaryInvalid = statValue(a, secondaryRankBy) <= 0;
      const bSecondaryInvalid = statValue(b, secondaryRankBy) <= 0;

      if (aSecondaryInvalid !== bSecondaryInvalid) {
        return aSecondaryInvalid ? 1 : -1;
      }

      return statValue(a, secondaryRankBy) - statValue(b, secondaryRankBy);
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
        (!secondaryRankBy ||
          statValue(result, secondaryRankBy) ===
            statValue(prev, secondaryRankBy));

      return [
        ...acc,
        { ...result, global_pos: isTied ? prev.global_pos : index + 1 },
      ];
    },
    [],
  );
};