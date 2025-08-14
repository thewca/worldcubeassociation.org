import { components } from "@/types/openapi";
import { Table } from "@chakra-ui/react";
import {
  AttemptsCells,
  CompetitionCell,
  CountryCell,
  PersonCell,
} from "@/components/results/ResultTableCells";
import { formatAttemptResult } from "@/lib/wca/wcif/attempts";
import _ from "lodash";

interface RankingsRowProps {
  ranking: components["schemas"]["ExtendedResult"];
  index: number;
  isAverage?: boolean;
}

function resultAttempts(result: components["schemas"]["ExtendedResult"]) {
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
      <Table.Cell>{index + 1}</Table.Cell>
      <PersonCell
        personId={ranking.person_id}
        personName={ranking.person_name}
      />
      <Table.Cell>
        {formatAttemptResult(ranking.value, ranking.event_id)}
      </Table.Cell>
      <CountryCell countryId={ranking.country_id} />
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
