"use client";

import { Link, Table, useBreakpointValue } from "@chakra-ui/react";
import {
  LiveAttemptsCells,
  LivePositionCell,
  LiveStatCells,
  LiveTableHeader,
} from "@/components/live/Cells";
import { Format } from "@/lib/wca/data/formats";
import { LiveResult } from "@/types/live";
import { statColumnsForFormat } from "@/lib/live/statColumnsForFormat";
import { parseActivityCode } from "@/lib/wca/wcif/rounds";

export default function ByPersonByRoundTable({
  format,
  eventResults: eventResults,
  competitionId,
}: {
  format: Format;
  eventResults: LiveResult[];
  competitionId: string;
}) {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const showFull = !isMobile;

  const stats = statColumnsForFormat(format);

  return (
    <Table.Root mb="10" size="sm">
      <LiveTableHeader format={format} showFull={showFull} byPerson />
      <Table.Body>
        {eventResults.map((result) => {
          const {
            round_wcif_id: wcifId,
            attempts,
            global_pos,
            registration_id,
          } = result;

          const { eventId, roundNumber } = parseActivityCode(wcifId);

          return (
            <Table.Row key={`${wcifId}`}>
              <Table.Cell>
                <Link
                  href={`/competitions/${competitionId}/live/rounds/${wcifId}`}
                >
                  Round {roundNumber}
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
