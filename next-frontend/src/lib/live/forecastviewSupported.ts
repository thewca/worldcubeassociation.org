import { LiveRoundAdmin } from "@/types/live";
import formats from "@/lib/wca/data/formats";
import { advancementResultCondition } from "@/lib/wca/wcif/rounds";

export function forecastViewSupported(
  round: Pick<LiveRoundAdmin, "id" | "format">,
  allRounds: Pick<LiveRoundAdmin, "participationRuleset">[],
  finished: boolean,
) {
  const format = formats.byId[round.format];
  const resultCondition = advancementResultCondition(round.id, allRounds);

  return (
    // Only relevant for rounds sorted by average
    format.sort_by === "average" &&
    // Only relevant for incomplete rounds
    !finished &&
    // Only final rounds or rounds with a ranking based
    // advancement condition are supported
    (!resultCondition || resultCondition.type === "ranking")
  );
}
