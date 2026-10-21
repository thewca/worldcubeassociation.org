"use client";

import { useMemo, useState } from "react";
import { components } from "@/types/openapi";
import { Heading, HStack, Spacer, Switch } from "@chakra-ui/react";
import _ from "lodash";
import events from "@/lib/wca/data/events";
import formats from "@/lib/wca/data/formats";
import { ResultsTable } from "@/components/results/ResultsTable";
import { useT } from "@/lib/i18n/useI18n";

type Round = components["schemas"]["V1CompetitionRound"];
type Result = components["schemas"]["V1RoundResult"] & {
  round_type_id: string;
};

// Linked (dual) rounds share a global_pos across both rounds. Merge them into one
// table ranked by the combined global_pos: by default keep each competitor's better
// round (mirroring the live results merging), or every result when showAll is set.
export function combineLinkedRound(rounds: Round[], showAll = false): Result[] {
  const rows = rounds.flatMap((round) =>
    round.results.map((r) => ({ ...r, round_type_id: round.round_type_id })),
  );
  const useAverage = formats.byId[rounds[0].format_id]?.sort_by === "average";
  const metric = (r: Result) => {
    const v = useAverage ? r.average : r.best;
    return v > 0 ? v : Infinity;
  };
  const kept = showAll
    ? rows
    : Object.values(_.groupBy(rows, "wca_id")).map((personRows) =>
        _.minBy(personRows, metric)!,
      );
  return _.sortBy(kept, ["global_pos", metric]);
}

export default function LinkedRoundResults({
  rounds,
  eventId,
}: {
  rounds: Round[];
  eventId: string;
}) {
  const { t } = useT();
  const [showAll, setShowAll] = useState(false);

  const combinedResults = useMemo(
    () => combineLinkedRound(rounds, showAll),
    [rounds, showAll],
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
        formatId={rounds[0].format_id}
        rankingMode="linked_round"
        variant="standings"
        t={t}
        isAdmin={false}
        solveTextAlign="center"
        showLinkedRoundsView={showAll}
      />
    </>
  );
}
