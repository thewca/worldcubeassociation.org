import { LiveRound } from "@/types/live";
import formats from "@/lib/wca/data/formats";

export function forecastViewSupported(
  round: Pick<LiveRound, "advancementCondition" | "format">,
  finished: boolean,
) {
  const format = formats.byId[round.format];

  return (
    // Only relevant for rounds sorted by average
    format.sort_by === "average" &&
    // Only relevant for incomplete rounds
    !finished &&
    // Only final rounds or rounds with a ranking based
    // advancement condition are supported
    // (the API omits advancementCondition entirely when there is none)
    (round.advancementCondition === undefined ||
      round.advancementCondition.type === "ranking")
  );
}
