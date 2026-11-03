"use client";

import { Fragment, useState } from "react";
import { components } from "@/types/openapi";
import { Heading, VStack } from "@chakra-ui/react";
import events from "@/lib/wca/data/events";
import { ResultsTable } from "@/components/results/ResultsTable";
import { useT } from "@/lib/i18n/useI18n";
import { SingleEventSelector } from "@/components/EventSelector";

export default function FilteredResults({
  competitionInfo,
  roundsByEvent,
}: {
  competitionInfo: components["schemas"]["CompetitionInfo"];
  roundsByEvent: Record<string, components["schemas"]["V1CompetitionRound"][]>;
}) {
  const [activeEventId, setActiveEventId] = useState<string>(
    competitionInfo.event_ids[0],
  );

  const { t } = useT();

  return (
    <VStack align="left" gap={4}>
      <SingleEventSelector
        title=""
        selectedEvent={activeEventId}
        onEventClick={setActiveEventId}
        eventList={competitionInfo.event_ids}
      />
      {roundsByEvent[activeEventId]?.map((round) => (
        <Fragment key={round.wcif_id}>
          <Heading textStyle="h3">
            {events.byId[activeEventId].name}{" "}
            {t(`rounds.${round.round_type_id}.name`)}
          </Heading>
          {/* Already ordered by `pos`, the position within this round. */}
          <ResultsTable
            results={round.results}
            eventId={activeEventId}
            formatId={round.format_id}
            rankingMode={round.ranking_mode}
            t={t}
            isAdmin={false}
            solveTextAlign="center"
          />
        </Fragment>
      ))}
    </VStack>
  );
}
