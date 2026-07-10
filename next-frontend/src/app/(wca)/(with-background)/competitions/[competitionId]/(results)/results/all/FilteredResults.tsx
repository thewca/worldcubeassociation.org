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

    const [linked, normal] = _.partition(
      eventResults,
      (r) => r.linked_round_id != null,
    );

    const linkedGroups = _.map(
      _.groupBy(linked, "linked_round_id"),
      (results, linkedRoundId) => ({
        key: `linked-${linkedRoundId}`,
        isLinked: true,
        roundTypeId: results[0].round_type_id,
        results,
      }),
    );

    const normalGroups = _.map(
      _.groupBy(normal, "round_type_id"),
      (results, roundTypeId) => ({
        key: roundTypeId,
        isLinked: false,
        roundTypeId,
        results,
      }),
    );

    // keep the rounds in the order the API returned them
    return _.sortBy([...normalGroups, ...linkedGroups], (group) =>
      eventResults.indexOf(group.results[0]),
    );
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
