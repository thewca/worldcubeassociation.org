import { components } from "@/types/openapi";
import { Table } from "@chakra-ui/react";
import {
  CompetitionCell,
  CountryCell,
  PersonCell,
} from "@/components/results/ResultTableCells";
import { formatAttemptResult } from "@/lib/wca/wcif/attempts";
import { recordAttempts } from "@/lib/wca/results/attempts";
import { AttemptsCells } from "@/components/results/TableCells";
import events from "@/lib/wca/data/events";

interface RankingsRowProps {
  ranking: components["schemas"]["ExtendedResult"];
  index: number;
  isAverage?: boolean;
  isByRegion?: boolean;
}

export function RankingsRow({
  ranking,
  index,
  isAverage = false,
  isByRegion = false,
}: RankingsRowProps) {
  const {
    definedAttempts: attempts,
    bestResultIndex,
    worstResultIndex,
  } = recordAttempts(ranking);

  const attemptCount =
    events.byId[ranking.event_id].recommendedFormat.expected_solve_count;

  return (
    <Table.Row>
      {isByRegion ? (
        <CountryCell countryId={ranking.country_id} filterable />
      ) : (
        <Table.Cell>{index + 1}</Table.Cell>
      )}
      <PersonCell
        personId={ranking.person_id}
        personName={ranking.person_name}
      />
      <Table.Cell>
        {formatAttemptResult(ranking.value, ranking.event_id)}
      </Table.Cell>
      {!isByRegion && <CountryCell countryId={ranking.country_id} filterable />}
      <CompetitionCell
        competitionId={ranking.competition_id}
        competitionName={ranking.competition_name}
        competitionCountry={ranking.competition_country_id}
      />
      {isAverage && (
        <AttemptsCells
          attempts={attempts}
          bestResultIndex={bestResultIndex}
          worstResultIndex={worstResultIndex}
          eventId={ranking.event_id}
          attemptCount={attemptCount}
        />
      )}
    </Table.Row>
  );
}
