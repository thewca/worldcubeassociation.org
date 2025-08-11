import { Table } from "@chakra-ui/react";
import {
  AttemptsCells,
  CompetitionCell,
  CountryCell,
  EventCell,
  PersonCell,
} from "@/components/results/ResultTableCells";
import { formatAttemptResult } from "@/lib/wca/wcif/attempts";
import { components } from "@/types/openapi";
import _ from "lodash";
import { TFunction } from "i18next";

function resultAttempts(result: components["schemas"]["Record"]) {
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

interface MixedRecordsRowProp {
  record: components["schemas"]["Record"];
  t: TFunction;
}

interface SeparateRecordsRowProp {
  record: components["schemas"]["Record"];
}

interface SlimRecordsRowProp {
  singles: components["schemas"]["Record"][];
  averages: components["schemas"]["Record"][];
}

export function MixedRecordsRow({ record, t }: MixedRecordsRowProp) {
  const {
    definedAttempts: attempts,
    bestResultIndex,
    worstResultIndex,
  } = resultAttempts(record);

  return (
    <Table.Row>
      <Table.Cell>
        {t(`results.selector_elements.type_selector.${record.type}`)}
      </Table.Cell>
      <PersonCell personId={record.person_id} personName={record.person_name} />
      <Table.Cell>
        {formatAttemptResult(record.value, record.event_id)}
      </Table.Cell>
      <CountryCell countryId={record.country_id} />
      <CompetitionCell
        competitionId={record.competition_id}
        competitionName={record.competition_name}
        competitionCountry={record.competition_country_id}
      />
      <AttemptsCells
        attempts={attempts}
        bestResultIndex={bestResultIndex}
        worstResultIndex={worstResultIndex}
        eventId={record.event_id}
      />
    </Table.Row>
  );
}

export function SeparateRecordsRow({ record }: SeparateRecordsRowProp) {
  const {
    definedAttempts: attempts,
    bestResultIndex,
    worstResultIndex,
  } = resultAttempts(record);

  return (
    <Table.Row>
      <EventCell eventId={record.event_id} />
      <Table.Cell>
        {formatAttemptResult(record.value, record.event_id)}
      </Table.Cell>
      <PersonCell personId={record.person_id} personName={record.person_name} />
      <CountryCell countryId={record.country_id} />
      <CompetitionCell
        competitionId={record.competition_id}
        competitionName={record.competition_name}
        competitionCountry={record.competition_country_id}
      />
      {record.type === "average" && (
        <AttemptsCells
          attempts={attempts}
          bestResultIndex={bestResultIndex}
          worstResultIndex={worstResultIndex}
          eventId={record.event_id}
        />
      )}
    </Table.Row>
  );
}

export function SlimRecordsRow({ singles, averages }: SlimRecordsRowProp) {
  const rowLengths = Math.max(singles.length, averages.length);

  return _.range(rowLengths).map((i) => {
    const single = singles[i];
    const average = averages[i];

    const {
      definedAttempts: attempts,
      bestResultIndex,
      worstResultIndex,
    } = resultAttempts(average);

    return (
      <Table.Row key={`${single?.id}-${average?.id}`}>
        {single && (
          <>
            <PersonCell
              personId={single.person_id}
              personName={single.person_name}
            />
            <Table.Cell>
              {formatAttemptResult(single.value, single.event_id)}
            </Table.Cell>
          </>
        )}
        <EventCell eventId={single.event_id} />
        {average && (
          <>
            <PersonCell
              personId={average.person_id}
              personName={average.person_name}
            />
            <Table.Cell>
              {formatAttemptResult(average.value, average.event_id)}
            </Table.Cell>
            <AttemptsCells
              attempts={attempts}
              bestResultIndex={bestResultIndex}
              worstResultIndex={worstResultIndex}
              eventId={average.event_id}
            />
          </>
        )}
      </Table.Row>
    );
  });
}
