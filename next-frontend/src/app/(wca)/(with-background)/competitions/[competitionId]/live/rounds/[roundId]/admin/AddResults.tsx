import { SimpleGrid, GridItem, Heading, Stack, Text } from "@chakra-ui/react";
import ClosableAlert from "@/components/ui/ClosableAlert";
import AttemptsForm from "@/components/live/AttemptsForm";
import formats from "@/lib/wca/data/formats";
import LiveUpdatingResultsTable from "@/components/live/LiveUpdatingResultsTable";
import {
  parseActivityCode,
  timeLimitToString,
  cutoffToString,
} from "@/lib/wca/wcif/rounds";
import { LiveRoundAdminBase } from "@/types/live";
import { getT } from "@/lib/i18n/get18n";

import type { components } from "@/types/openapi";

type WcifEvent = components["schemas"]["WcifEvent"];

export default async function AddResults({
  competitionId,
  roundName,
  round,
  rounds,
}: {
  competitionId: string;
  roundName: string;
  round: LiveRoundAdminBase;
  rounds: LiveRoundAdminBase[];
}) {
  const { eventId } = parseActivityCode(round.id);
  const format = formats.byId[round.format];

  const { t } = await getT();

  const isLocked = round.state === "locked";

  // timeLimitToString needs the surrounding events to render cumulative time
  // limits that span multiple rounds, so reconstruct them from all rounds.
  const siblingEvents: WcifEvent[] = Object.values(
    rounds.reduce<Record<string, WcifEvent>>((acc, siblingRound) => {
      const { eventId: siblingEventId } = parseActivityCode(siblingRound.id);
      acc[siblingEventId] ??= {
        id: siblingEventId,
        rounds: [],
        extensions: [],
      };
      acc[siblingEventId].rounds.push(siblingRound);
      return acc;
    }, {}),
  );

  return (
    <>
      {isLocked && (
        <ClosableAlert
          status="warning"
          title={t("competitions.live.admin.warnings.round_locked")}
        />
      )}
      <Heading textStyle="h1">{roundName}</Heading>
      <Stack gap={1}>
        <Text>
          {t("competitions.events.time_limit")}:{" "}
          {timeLimitToString(t, round.timeLimit, eventId, siblingEvents)}
        </Text>
        <Text>
          {t("competitions.events.cutoff")}:{" "}
          {round.cutoff ? cutoffToString(t, round.cutoff, eventId) : "None"}
        </Text>
      </Stack>
      <SimpleGrid columns={16} gap={6}>
        <GridItem colSpan={4} position="sticky" top={4} alignSelf="start">
          <AttemptsForm
            header="Add Result"
            eventId={eventId}
            cutoff={round.cutoff}
            solveCount={format.expected_solve_count}
          />
        </GridItem>

        <GridItem colSpan={12}>
          <LiveUpdatingResultsTable
            roundWcifId={round.id}
            formatId={round.format}
            competitionId={competitionId}
            isAdminView
            canManage
            title=""
          />
        </GridItem>
      </SimpleGrid>
    </>
  );
}
