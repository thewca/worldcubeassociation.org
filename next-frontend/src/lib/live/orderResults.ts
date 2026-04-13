import { Format } from "@/lib/wca/data/formats";
import { statColumnsForFormat } from "@/lib/live/statColumnsForFormat";
import { LiveResult } from "@/types/live";

export const orderResults = (results: LiveResult[], format: Format) => {
  const stats = statColumnsForFormat(format);

  const rankBy = stats[0].field;
  const secondaryRankBy = stats[1].field;

  const sortedResults = results.toSorted((a, b) => {
    const aInvalid = a[rankBy] <= 0;
    const bInvalid = b[rankBy] <= 0;

    if (aInvalid !== bInvalid) {
      return aInvalid ? 1 : -1;
    }

    if (aInvalid && bInvalid) {
      // Three-tier invalid ordering: valid > negative (DNF/DNS, < 0) > empty (0)
      // Negative means the competitor attempted but got DNF/DNS.
      // Zero means no attempts were entered yet.
      const aEmpty = a[rankBy] === 0;
      const bEmpty = b[rankBy] === 0;
      if (aEmpty !== bEmpty) {
        return aEmpty ? 1 : -1;
      }
    }

    if (a[rankBy] !== b[rankBy]) {
      return a[rankBy] - b[rankBy];
    }

    if (secondaryRankBy) {
      const aSecondaryInvalid = a[secondaryRankBy] <= 0;
      const bSecondaryInvalid = b[secondaryRankBy] <= 0;

      if (aSecondaryInvalid !== bSecondaryInvalid) {
        return aSecondaryInvalid ? 1 : -1;
      }

      if (aSecondaryInvalid && bSecondaryInvalid) {
        const aSecondaryEmpty = a[secondaryRankBy] === 0;
        const bSecondaryEmpty = b[secondaryRankBy] === 0;
        if (aSecondaryEmpty !== bSecondaryEmpty) {
          return aSecondaryEmpty ? 1 : -1;
        }
      } else {
        return a[secondaryRankBy] - b[secondaryRankBy];
      }
    }
    // Sort by registration id as a fallback
    return a.registration_id - b.registration_id;
  });

  // Use reduce instead of map so that `prev` refers to the already-computed
  // result with its updated global_pos, not the original input element.
  return sortedResults.reduce<(LiveResult & { global_pos: number })[]>(
    (acc, result, index) => {
      if (index === 0) {
        acc.push({ ...result, global_pos: 1 });
        return acc;
      }

      const prev = acc[index - 1];

      // DNF and DNS (both negative) are tied with each other regardless of exact
      // sentinel value (-1 vs -2). Empty results (0) are similarly all tied.
      const prevNegPrimary = prev[rankBy] < 0;
      const currNegPrimary = result[rankBy] < 0;
      const prevNegSecondary = !secondaryRankBy || prev[secondaryRankBy] < 0;
      const currNegSecondary = !secondaryRankBy || result[secondaryRankBy] < 0;

      const isTied =
        (prevNegPrimary &&
          currNegPrimary &&
          prevNegSecondary &&
          currNegSecondary) ||
        (result[rankBy] === prev[rankBy] &&
          (!secondaryRankBy ||
            result[secondaryRankBy] === prev[secondaryRankBy]));

      acc.push({ ...result, global_pos: isTied ? prev.global_pos : index + 1 });
      return acc;
    },
    [],
  );
};
