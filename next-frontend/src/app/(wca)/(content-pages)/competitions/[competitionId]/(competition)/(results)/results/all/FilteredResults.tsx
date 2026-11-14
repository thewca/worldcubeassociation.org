"use client";

import { useState } from "react";
import _ from "lodash";
import { components } from "@/types/openapi";
import { Accordion, Box, Heading, VStack } from "@chakra-ui/react";
import events from "@/lib/wca/data/events";
import { ResultsTable } from "@/components/results/ResultsTable";
import LinkedRoundResults from "@/components/results/LinkedRoundResults";
import HeadToHeadBracket from "@/components/results/HeadToHeadBracket";
import { useT } from "@/lib/i18n/useI18n";
import { SingleEventSelector } from "@/components/EventSelector";
import useIsScrolled from "@/lib/hooks/useIsScrolled";
import BackToTopButton from "@/components/BackToTopButton";

// Helper for sorting rounds from final to first using their wcif_id
const roundCompare = (a: { wcif_id: string }, b: { wcif_id: string }) =>
  b.wcif_id.localeCompare(a.wcif_id, undefined, { numeric: true });

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

  const { isScrolledDown, topSentinelRef } = useIsScrolled();

  // The rounds of a Dual Round are shown together, in place of the first one.
  const roundGroups = _.values(
    _.groupBy(roundsByEvent[activeEventId] ?? [], (round) =>
      round.ranking_mode === "linked_round"
        ? round.linked_round_wcif_ids?.join()
        : round.wcif_id,
    ),
  )
    .map((group) => [...group].sort(roundCompare))
    .sort((a, b) => roundCompare(a[0], b[0]));

  const eventName = events.byId[activeEventId].name;

  return (
    <VStack align="left" gap={4}>
      <SingleEventSelector
        title=""
        selectedEvent={activeEventId}
        onEventClick={setActiveEventId}
        eventList={competitionInfo.event_ids}
      />

      <Box ref={topSentinelRef} position="absolute" />

      <Accordion.Root
        key={activeEventId}
        multiple
        defaultValue={["0"]}
        variant="enclosed"
      >
        {roundGroups.map(([round, ...linkedRounds], index) => (
          <Accordion.Item key={index} value={index.toString()}>
            {linkedRounds.length > 0 ? (
              <>
                <Accordion.ItemTrigger justifyContent="space-between">
                  <Heading textStyle="s1">
                    {eventName} {t("competitions.live.combined_title")}
                  </Heading>
                  <Accordion.ItemIndicator />
                </Accordion.ItemTrigger>
                <Accordion.ItemContent>
                  <Accordion.ItemBody>
                    <LinkedRoundResults
                      key={round.wcif_id}
                      rounds={[round, ...linkedRounds]}
                      eventId={activeEventId}
                    />
                  </Accordion.ItemBody>
                </Accordion.ItemContent>
              </>
            ) : (
              <>
                <Accordion.ItemTrigger justifyContent="space-between">
                  <Heading textStyle="s1">
                    {eventName} {t(`rounds.${round.round_type_id}.name`)}
                  </Heading>
                  <Accordion.ItemIndicator />
                </Accordion.ItemTrigger>
                <Accordion.ItemContent>
                  <Accordion.ItemBody>
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
                  </Accordion.ItemBody>
                </Accordion.ItemContent>
              </>
            )}
          </Accordion.Item>
        ))}
      </Accordion.Root>

      <BackToTopButton visible={isScrolledDown} />
    </VStack>
  );
}
