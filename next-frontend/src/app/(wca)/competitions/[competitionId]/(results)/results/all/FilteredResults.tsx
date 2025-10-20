"use client";

import { Fragment, useMemo, useState } from "react";
import { components } from "@/types/openapi";
import { Heading, VStack } from "@chakra-ui/react";
import EventSelector from "@/components/EventSelector";
import _ from "lodash";
import events from "@/lib/wca/data/events";
import { ResultsTable } from "@/components/results/ResultsTable";
import { useT } from "@/lib/i18n/useI18n";

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

  const results = useMemo(
    () => _.groupBy(resultsByEvent[activeEventId], "round_type_id"),
    [activeEventId, resultsByEvent],
  );

  return (
    <VStack align="left" gap={4}>
      <EventSelector
        title=""
        selectedEvents={[activeEventId]}
        onEventClick={setActiveEventId}
        eventList={competitionInfo.event_ids}
        hideAllButton
        hideClearButton
      />
      {_.map(results, (results, roundFormat) => (
        <Fragment key={`${activeEventId}-${roundFormat}`}>
          <Heading textStyle="h3">
            {events.byId[activeEventId].name} {t(`rounds.${roundFormat}.name`)}
          </Heading>
          <ResultsTable
            results={results.toSorted((a, b) => a.pos - b.pos)}
            eventId={activeEventId}
            t={t}
            isAdmin={false}
          />
        </Fragment>
      ))}
    </VStack>
  );
}
