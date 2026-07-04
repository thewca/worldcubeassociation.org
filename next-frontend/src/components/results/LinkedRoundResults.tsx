"use client";

import { useMemo, useState } from "react";
import { components } from "@/types/openapi";
import { Heading, HStack, Spacer, Switch } from "@chakra-ui/react";
import _ from "lodash";
import events from "@/lib/wca/data/events";
import formats from "@/lib/wca/data/formats";
import { ResultsTable } from "@/components/results/ResultsTable";
import { useT } from "@/lib/i18n/useI18n";

type Result = components["schemas"]["Result"];

// Linked (dual) rounds share a global_pos across both rounds. Merge them into one
// table ranked by the combined global_pos: by default keep each competitor's better
// round (mirroring the live results merging), or every result when showAll is set.
export function combineLinkedRound(rows: Result[], showAll = false): Result[] {
  const useAverage = formats.byId[rows[0].format_id]?.sort_by === "average";
  const metric = (r: Result) => {
    const v = useAverage ? r.average : r.best;
    return v > 0 ? v : Infinity;
  };
  const kept = showAll
    ? rows
    : _.chain(rows)
        .groupBy("wca_id")
        .map((personRows) => _.minBy(personRows, metric)!)
        .value();
  return _.chain(kept)
    .map((r) => ({ ...r, pos: r.global_pos }))
    .sortBy(["pos", metric])
    .value();
}

export default function LinkedRoundResults({
  results,
  eventId,
}: {
  results: Result[];
  eventId: string;
}) {
  const { t } = useT();
  const [showAll, setShowAll] = useState(false);

  const combinedResults = useMemo(
    () => combineLinkedRound(results, showAll),
    [results, showAll],
  );

  return (
    <>
      <HStack>
        <Heading textStyle="h3">
          {events.byId[eventId].name} {t("competitions.live.combined_title")}
        </Heading>
        <Spacer />
        <Switch.Root
          checked={showAll}
          onCheckedChange={(e) => setShowAll(e.checked)}
          colorPalette="green"
        >
          <Switch.HiddenInput />
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          <Switch.Label>Show all results</Switch.Label>
        </Switch.Root>
      </HStack>
      <ResultsTable
        results={combinedResults}
        eventId={eventId}
        t={t}
        isAdmin={false}
      />
    </>
  );
}
