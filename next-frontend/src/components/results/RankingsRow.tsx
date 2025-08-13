import { components } from "@/types/openapi";
import { Table } from "@chakra-ui/react";
import { formatAttemptResult } from "../../../../app/webpacker/lib/wca-live/attempts";
import {
  AttemptsCells,
  CompetitionCell,
  CountryCell,
} from "@/components/results/ResultTableCells";

interface RankingsRowProps {
  ranking: components["schemas"]["Result"];
  index: number;
  isAverage?: boolean;
}

function resultAttempts(result: components["schemas"]["Result"]) {
  const definedAttempts = [
    result?.value1,
    result?.value2,
    result?.value3,
    result?.value4,
    result?.value5,
  ].filter((res) => res !== undefined);

  const validAttempts = definedAttempts.filter((res) => res !== 0);
  const completedAttempts = validAttempts.filter((res) => res > 0);
  const uncompletedAttempts = validAttempts.filter((res) => res < 0);

  // DNF/DNS values are very small. If all solves were successful,
  //   then `uncompletedAttempts` is empty and the min is `undefined`,
  //   which means we fall back to the actually slowest value.
  const worstResult = _.min(uncompletedAttempts) || _.max(validAttempts);
  const bestResult = _.min(completedAttempts);

  const bestResultIndex = definedAttempts.indexOf(bestResult!);
  const worstResultIndex = definedAttempts.indexOf(worstResult!);

  return {
    definedAttempts,
    bestResultIndex,
    worstResultIndex,
  };
}

export function RankingsRow({
  ranking,
  index,
  isAverage = false,
}: RankingsRowProps) {
  const {
    definedAttempts: attempts,
    bestResultIndex,
    worstResultIndex,
  } = resultAttempts(ranking);

  return (
    <Table.Row>
      <Table.Cell>{index}</Table.Cell>
      <Table.Cell>{formatAttemptResult(ranking.value)}</Table.Cell>
      <CountryCell countryId={ranking.country_id} />
      <CompetitionCell
        competitionId={ranking.competition_id}
        competitionName={ranking.competitionName}
        competitionCountry={ranking.competitionCountry}
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
