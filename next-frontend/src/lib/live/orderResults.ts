import { Format } from "@/lib/wca/data/formats";
import { components } from "@/types/openapi";
import { statColumnsForFormat } from "@/lib/live/statColumnsForFormat";

export const orderResults = (
  results: components["schemas"]["LiveResult"][],
  format: Format,
) => {
  const validResults = results.filter((result) => result.best !== 0);

  const stats = statColumnsForFormat(format);

  const rankBy = stats[0].field;
  const secondaryRankBy = stats[1].field;

  const sortedResults = [...validResults].sort((a, b) => {
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

    return 0;
  });

  let currentRank = 1;
  sortedResults.forEach((result, index) => {
    if (index === 0) {
      result.global_pos = currentRank;
    } else {
      const prev = sortedResults[index - 1];

      const isTied =
        result[rankBy] === prev[rankBy] &&
        (!secondaryRankBy || result[secondaryRankBy] === prev[secondaryRankBy]);

      if (!isTied) {
        currentRank = index + 1;
      }

      result.global_pos = currentRank;
    }
  });

  return sortedResults;
};
