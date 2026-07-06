import { LiveRound } from "@/types/live";
import formats from "@/lib/wca/data/formats";

export function forecastViewSupported(
  round: Pick<LiveRound, "advancementCondition" | "format">,
  finished: boolean,
) {
  const format = formats.byId[round.format];

  return (
    // Only relevant for rounds sorted by average
    format.sort_by != "best" &&
    // Only relevant for incomplete rounds
    !finished &&
    // Only final rounds or rounds with a ranking based
    // advancement condition are supported
    (round.advancementCondition === null ||
      round.advancementCondition?.type === "ranking")
  );
}
