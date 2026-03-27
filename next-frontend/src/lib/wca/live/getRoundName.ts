import { getRounds } from "@/lib/wca/live/getRounds";
import { getRoundTypeId, parseActivityCode } from "@/lib/wca/wcif/rounds";
import _ from "lodash";
import { TFunction } from "i18next";
import { LiveRoundAdmin } from "@/types/live";
import events from "@/lib/wca/data/events";

export async function fetchRoundName(
  competitionId: string,
  roundWcifId: string,
  t: TFunction,
  withEvent = false,
) {
  // This is always cached on request cycle TODO: We should do a rewrite on our caching to also cache outside of request cycle
  const { data: roundsData } = await getRounds(competitionId);

  if (!roundsData) {
    return "";
  }

  return getRoundName(roundWcifId, t, roundsData.rounds, withEvent);
}

export function getRoundName(
  roundWcifId: string,
  t: TFunction,
  rounds: LiveRoundAdmin[],
  withEvent = false,
) {
  const roundsByEventId = _.groupBy(
    rounds,
    (r) => parseActivityCode(r.id).eventId,
  );

  const round = rounds.find((r) => r.id === roundWcifId)!;

  const { eventId, roundNumber } = parseActivityCode(round.id);

  const roundTypeId = getRoundTypeId(
    roundNumber!,
    roundsByEventId[eventId].length,
    !!round.cutoff,
  );

  const roundName = t(`rounds.${roundTypeId}.name`);

  return [...(withEvent ? events.byId[eventId].name : []), roundName].join(
    " - ",
  );
}
