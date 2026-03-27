"use client";

import { Link, Table, useBreakpointValue } from "@chakra-ui/react";
import {
  LiveAttemptsCells,
  LivePositionCell,
  LiveStatCells,
  LiveTableHeader,
} from "@/components/live/Cells";
import formats from "@/lib/wca/data/formats";
import { LiveResult, LiveRoundAdmin } from "@/types/live";
import { statColumnsForFormat } from "@/lib/live/statColumnsForFormat";
import { getRoundTypeId, parseActivityCode } from "@/lib/wca/wcif/rounds";
import { useT } from "@/lib/i18n/useI18n";
import _ from "lodash";

export default function ByPersonByRoundTable({
  eventResults: eventResults,
  competitionId,
  rounds,
}: {
  eventResults: LiveResult[];
  competitionId: string;
  rounds: LiveRoundAdmin[];
}) {
  const { t } = useT();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const showFull = !isMobile;

  const roundsByWcifId = _.keyBy(rounds, "id");

  return (
    <Table.Root mb="10" size="sm">
      <LiveTableHeader
        format={formats.byId[rounds[0].format]}
        showFull={showFull}
        byPerson
      />
      <Table.Body>
        {eventResults.map((result) => {
          const {
            round_wcif_id: wcifId,
            attempts,
            global_pos,
            registration_id,
          } = result;

          const { eventId, roundNumber } = parseActivityCode(wcifId);
          const round = roundsByWcifId[wcifId];

          const roundTypeId = getRoundTypeId(
            roundNumber!,
            rounds.length,
            Boolean(round.cutoff),
          );

          const format = formats.byId[round.format];
          const stats = statColumnsForFormat(format);

          return (
            <Table.Row key={wcifId}>
              <Table.Cell>
                <Link
                  href={`/competitions/${competitionId}/live/rounds/${wcifId}`}
                >
                  {t(`rounds.${roundTypeId}.name`)}
                </Link>
              </Table.Cell>
              <LivePositionCell
                position={global_pos}
                advancingParams={result}
              />
              {showFull && (
                <LiveAttemptsCells
                  format={format}
                  attempts={attempts}
                  eventId={eventId}
                  competitorId={registration_id}
                />
              )}
              <LiveStatCells
                stats={stats}
                eventId={eventId}
                result={result}
                competitorId={registration_id}
              />
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Root>
  );
}
