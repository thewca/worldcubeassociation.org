"use client";

import { Fragment, useState } from "react";
import { components } from "@/types/openapi";
import { Heading, VStack } from "@chakra-ui/react";
import _ from "lodash";
import events from "@/lib/wca/data/events";
import { ResultsTable } from "@/components/results/ResultsTable";
import { useT } from "@/lib/i18n/useI18n";
import { SingleEventSelector } from "@/components/EventSelector";
import roundTypes from "@/lib/wca/data/roundTypes";

export default function FilteredResults({
  competitionInfo,
  resultsByEvent,
}: {
  competitionInfo: components["schemas"]["CompetitionInfo"];
  resultsByEvent: Record<string, components["schemas"]["Result"][]>;
}) {
  const [activeEventId, setActiveEventId] = useState<string>(
    competitionInfo.event_ids[0],
  );

  const { t } = useT();

  const resultsByRound = _.groupBy(
    resultsByEvent[activeEventId],
    "round_type_id",
  );

  const orderedRoundTypes = _.sortBy(
    _.keys(resultsByRound),
    (roundType) => roundTypes.byId[roundType].rank,
  );

  return (
    <VStack align="left" gap={4}>
      <SingleEventSelector
        title=""
        selectedEvent={activeEventId}
        onEventClick={setActiveEventId}
        eventList={competitionInfo.event_ids}
      />
      {_.map(orderedRoundTypes, (roundType) => (
        <Fragment key={`${activeEventId}-${roundType}`}>
          <Heading textStyle="h3">
            {events.byId[activeEventId].name} {t(`rounds.${roundType}.name`)}
          </Heading>
          <ResultsTable
            results={resultsByRound[roundType].toSorted(
              (a, b) => a.pos - b.pos,
            )}
            eventId={activeEventId}
            formatId={
              resultsByRound[roundType][0]
                .format_id /* anti-pattern because of current prop type restrictions */
            }
            t={t}
            isAdmin={false}
            solveTextAlign="center"
          />
        </Fragment>
      ))}
    </VStack>
  );
}
