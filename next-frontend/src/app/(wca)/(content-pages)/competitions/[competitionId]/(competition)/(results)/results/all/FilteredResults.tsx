"use client";

import { Fragment, useState } from "react";
import _ from "lodash";
import { components } from "@/types/openapi";
import { Heading, VStack } from "@chakra-ui/react";
import events from "@/lib/wca/data/events";
import { ResultsTable } from "@/components/results/ResultsTable";
import LinkedRoundResults from "@/components/results/LinkedRoundResults";
import HeadToHeadBracket from "@/components/results/HeadToHeadBracket";
import { useT } from "@/lib/i18n/useI18n";
import { SingleEventSelector } from "@/components/EventSelector";

export default function FilteredResults({
  competitionInfo,
  roundsByEvent,
  h2hRoundsById,
}: {
  competitionInfo: components["schemas"]["CompetitionInfo"];
  roundsByEvent: Record<string, components["schemas"]["V1CompetitionRound"][]>;
  h2hRoundsById: Record<string, components["schemas"]["H2hRound"]>;
}) {
  const [activeEventId, setActiveEventId] = useState<string>(
    competitionInfo.event_ids[0],
  );

  const { t } = useT();

  // The rounds of a Dual Round are shown together, in place of the first one.
  const roundGroups = _.values(
    _.groupBy(roundsByEvent[activeEventId] ?? [], (round) =>
      round.ranking_mode === "linked_round"
        ? round.linked_round_wcif_ids?.join()
        : round.wcif_id,
    ),
  );

  return (
    <VStack align="left" gap={4}>
      <SingleEventSelector
        title=""
        selectedEvent={activeEventId}
        onEventClick={setActiveEventId}
        eventList={competitionInfo.event_ids}
      />
      {roundGroups.map(([round, ...linkedRounds]) =>
        linkedRounds.length > 0 ? (
          <LinkedRoundResults
            key={round.wcif_id}
            rounds={[round, ...linkedRounds]}
            eventId={activeEventId}
          />
        ) : (
          <Fragment key={round.wcif_id}>
            <Heading textStyle="h3">
              {events.byId[activeEventId].name}{" "}
              {t(`rounds.${round.round_type_id}.name`)}
            </Heading>
            {h2hRoundsById[round.wcif_id] ? (
              <HeadToHeadBracket round={h2hRoundsById[round.wcif_id]} />
            ) : (
              /* Already ordered by `pos`, the position within this round. */
              <ResultsTable
                results={round.results}
                eventId={activeEventId}
                formatId={round.format_id}
                rankingMode={round.ranking_mode}
                t={t}
                isAdmin={false}
                solveTextAlign="center"
              />
            )}
          </Fragment>
        ),
      )}
    </VStack>
  );
}
