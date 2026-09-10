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

  const groupedResults = _.groupBy(
    resultsByEvent[activeEventId],
    "round_type_id",
  );

  const orderedRounds = _.sortBy(
    _.keys(groupedResults),
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
      {_.map(orderedRounds, (roundFormat) => (
        <Fragment key={`${activeEventId}-${roundFormat}`}>
          <Heading textStyle="h3">
            {events.byId[activeEventId].name} {t(`rounds.${roundFormat}.name`)}
          </Heading>
          <ResultsTable
            results={groupedResults[roundFormat].toSorted(
              (a, b) => a.pos - b.pos,
            )}
            eventId={activeEventId}
            t={t}
            isAdmin={false}
            solveTextAlign="center"
          />
        </Fragment>
      ))}
    </VStack>
  );
}
