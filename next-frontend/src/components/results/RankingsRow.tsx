import { components } from "@/types/openapi";
import { Table } from "@chakra-ui/react";
import {
  AttemptsCells,
  CompetitionCell,
  CountryCell,
  PersonCell,
} from "@/components/results/ResultTableCells";
import { formatAttemptResult } from "@/lib/wca/wcif/attempts";
import { recordAttempts } from "@/lib/wca/results/attempts";

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

  return (
    <Table.Row>
      {isByRegion ? (
        <CountryCell countryId={ranking.country_id} />
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
      {!isByRegion && <CountryCell countryId={ranking.country_id} />}
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
        />
      )}
    </Table.Row>
  );
}
