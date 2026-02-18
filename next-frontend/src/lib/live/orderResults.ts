import { Format } from "@/lib/wca/data/formats";
import { components } from "@/types/openapi";
import { statColumnsForFormat } from "@/lib/live/statColumnsForFormat";

export const orderResults = (
  results: components["schemas"]["LiveResult"][],
  format: Format,
) => {
  const stats = statColumnsForFormat(format);

  const rankBy = stats[0].field;
  const secondaryRankBy = stats[1].field;

  const sortedResults = results.toSorted((a, b) => {
    const aInvalid = a[rankBy] <= 0;
    const bInvalid = b[rankBy] <= 0;

    if (aInvalid !== bInvalid) {
      return aInvalid ? 1 : -1;
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

      return a[secondaryRankBy] - b[secondaryRankBy];
    }
    // Sort by registration id as a fallback
    return a.registration_id - b.registration_id;
  });

  return sortedResults.map((result, index, arr) => {
    if (index === 0) {
      return { ...result, global_pos: 1 };
    }

    const prev = arr[index - 1];

    const isTied =
      result[rankBy] === prev[rankBy] &&
      (!secondaryRankBy || result[secondaryRankBy] === prev[secondaryRankBy]);

    const global_pos = isTied ? prev.global_pos : index + 1;

    return { ...result, global_pos };
  });
};
