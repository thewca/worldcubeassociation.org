import { Table } from "@chakra-ui/react";
import {
  CompetitionCell,
  CountryCell,
  EventCell,
  PersonCell,
} from "@/components/results/ResultTableCells";
import { formatAttemptResult } from "@/lib/wca/wcif/attempts";
import { components } from "@/types/openapi";
import _ from "lodash";
import { TFunction } from "i18next";
import { recordAttempts } from "@/lib/wca/results/attempts";
import { AttemptsCells } from "@/components/results/TableCells";

interface MixedRecordsRowProp {
  record: components["schemas"]["Record"];
  t: TFunction;
}

interface SeparateRecordsRowProp {
  record: components["schemas"]["Record"];
}

interface HistoryRowProps {
  record: components["schemas"]["Record"];
  mixed?: boolean;
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
  } = recordAttempts(record);

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

export function HistoryRow({ record, mixed = false }: HistoryRowProps) {
  const {
    definedAttempts: attempts,
    bestResultIndex,
    worstResultIndex,
  } = recordAttempts(record);

  const formattedValue = formatAttemptResult(record.value, record.event_id);

  return (
    <Table.Row>
      <Table.Cell>{record.start_date}</Table.Cell>
      {mixed && <EventCell eventId={record.event_id} />}
      <PersonCell personId={record.person_id} personName={record.person_name} />
      {record.type === "single" ? (
        <Table.Cell>{formattedValue}</Table.Cell>
      ) : (
        <Table.Cell />
      )}
      {record.type === "average" ? (
        <Table.Cell>{formattedValue}</Table.Cell>
      ) : (
        <Table.Cell />
      )}
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
  } = recordAttempts(record);

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
    } = recordAttempts(average);

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
