import { getRoundTypeId, parseActivityCode } from "@/lib/wca/wcif/rounds";
import _ from "lodash";
import { TFunction } from "i18next";
import { LiveRoundAdminBase } from "@/types/live";
import events from "@/lib/wca/data/events";
import { useAllRoundsInfo, useRoundInfo } from "@/providers/RoundInfoProvider";
import { useT } from "@/lib/i18n/useI18n";

export function getRoundName(
  roundWcifId: string,
  t: TFunction,
  rounds: Pick<LiveRoundAdminBase, "id" | "cutoff">[],
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
  const eventOrEmpty = withEvent ? [events.byId[eventId].name] : [];

  return [...eventOrEmpty, roundName].join(" - ");
}

export function useRoundName() {
  const { rounds } = useAllRoundsInfo();
  const { id } = useRoundInfo();
  const { t } = useT();

  return getRoundName(id, t, rounds, true);
}
