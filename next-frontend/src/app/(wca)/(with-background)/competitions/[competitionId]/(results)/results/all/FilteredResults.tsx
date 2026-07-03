"use client";

import { Fragment, useMemo, useState } from "react";
import { components } from "@/types/openapi";
import { Heading, VStack } from "@chakra-ui/react";
import _ from "lodash";
import events from "@/lib/wca/data/events";
import { ResultsTable } from "@/components/results/ResultsTable";
import LinkedRoundResults from "@/components/results/LinkedRoundResults";
import { useT } from "@/lib/i18n/useI18n";
import { SingleEventSelector } from "@/components/EventSelector";

type Result = components["schemas"]["Result"];

export default function FilteredResults({
  competitionInfo,
  resultsByEvent,
}: {
  competitionInfo: components["schemas"]["CompetitionInfo"];
  resultsByEvent: Record<string, Result[]>;
}) {
  const [activeEventId, setActiveEventId] = useState<string>(
    competitionInfo.event_ids[0],
  );

  const { t } = useT();

  const roundGroups = useMemo(() => {
    const eventResults = resultsByEvent[activeEventId] ?? [];
    const byKey = _.groupBy(eventResults, (r) =>
      r.linked_round_id != null
        ? `linked-${r.linked_round_id}`
        : r.round_type_id,
    );
    return _.map(byKey, (rows, key) => ({
      key,
      isLinked: key.startsWith("linked-"),
      roundTypeId: rows[0].round_type_id,
      results: rows,
    }));
  }, [activeEventId, resultsByEvent]);

  return (
    <VStack align="left" gap={4}>
      <SingleEventSelector
        title=""
        selectedEvent={activeEventId}
        onEventClick={setActiveEventId}
        eventList={competitionInfo.event_ids}
      />
      {roundGroups.map((group) =>
        group.isLinked ? (
          <LinkedRoundResults
            key={`${activeEventId}-${group.key}`}
            results={group.results}
            eventId={activeEventId}
          />
        ) : (
          <Fragment key={`${activeEventId}-${group.key}`}>
            <Heading textStyle="h3">
              {events.byId[activeEventId].name}{" "}
              {t(`rounds.${group.roundTypeId}.name`)}
            </Heading>
            <ResultsTable
              results={group.results.toSorted((a, b) => a.pos - b.pos)}
              eventId={activeEventId}
              t={t}
              isAdmin={false}
            />
          </Fragment>
        ),
      )}
    </VStack>
  );
}
