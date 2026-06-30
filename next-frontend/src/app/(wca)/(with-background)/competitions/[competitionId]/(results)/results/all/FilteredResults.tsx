"use client";

import { Fragment, useMemo, useState } from "react";
import { components } from "@/types/openapi";
import { Heading, VStack } from "@chakra-ui/react";
import _ from "lodash";
import events from "@/lib/wca/data/events";
import formats from "@/lib/wca/data/formats";
import { ResultsTable } from "@/components/results/ResultsTable";
import { useT } from "@/lib/i18n/useI18n";
import { SingleEventSelector } from "@/components/EventSelector";

type Result = components["schemas"]["Result"];

// Linked (dual) rounds share a global_pos across both rounds. Merge them into one
// table: keep each competitor's better round and rank by the combined global_pos,
// mirroring the live results merging.
export function combineLinkedRound(rows: Result[]): Result[] {
  const useAverage = formats.byId[rows[0].format_id]?.sort_by === "average";
  const metric = (r: Result) => {
    const v = useAverage ? r.average : r.best;
    return v > 0 ? v : Infinity;
  };
  return _.chain(rows)
    .groupBy("wca_id")
    .map((personRows) => _.minBy(personRows, metric)!)
    .map((r) => ({ ...r, pos: r.global_pos }))
    .sortBy("pos")
    .value();
}

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
    return _.map(byKey, (rows, key) => {
      const isLinked = key.startsWith("linked-");
      return {
        key,
        isLinked,
        roundTypeId: rows[0].round_type_id,
        results: isLinked
          ? combineLinkedRound(rows)
          : rows.toSorted((a, b) => a.pos - b.pos),
      };
    });
  }, [activeEventId, resultsByEvent]);

  return (
    <VStack align="left" gap={4}>
      <SingleEventSelector
        title=""
        selectedEvent={activeEventId}
        onEventClick={setActiveEventId}
        eventList={competitionInfo.event_ids}
      />
      {roundGroups.map((group) => (
        <Fragment key={`${activeEventId}-${group.key}`}>
          <Heading textStyle="h3">
            {events.byId[activeEventId].name}{" "}
            {group.isLinked
              ? t("competitions.results_table.combined_dual_round")
              : t(`rounds.${group.roundTypeId}.name`)}
          </Heading>
          <ResultsTable
            results={group.results}
            eventId={activeEventId}
            t={t}
            isAdmin={false}
          />
        </Fragment>
      ))}
    </VStack>
  );
}
