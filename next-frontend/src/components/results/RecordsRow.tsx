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
import events from "@/lib/wca/data/events";

interface MixedRecordsRowProp {
  record: components["schemas"]["Record"];
  t: TFunction;
}

interface SeparateRecordsRowProp {
  record: components["schemas"]["Record"];
}

interface HistoryRowProps {
  record: components["schemas"]["Record"];
}

const maxAttemptCountForEvent = (eventId: string) => {
  const formatSolveCounts = events.byId[eventId].formats.map(
    (fmt) => fmt.expected_solve_count,
  );

  return _.max(formatSolveCounts)!;
};

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
      <CountryCell countryId={record.country_id} filterable />
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
        attemptCount={maxAttemptCountForEvent(record.event_id)}
      />
    </Table.Row>
  );
}

export function HistoryRow({ record }: HistoryRowProps) {
  const {
    definedAttempts: attempts,
    bestResultIndex,
    worstResultIndex,
  } = recordAttempts(record);

  const formattedValue = formatAttemptResult(record.value, record.event_id);

  return (
    <Table.Row>
      <Table.Cell>{record.start_date}</Table.Cell>
      <EventCell eventId={record.event_id} />
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
      <CountryCell countryId={record.country_id} filterable />
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
        attemptCount={maxAttemptCountForEvent(record.event_id)}
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
      <CountryCell countryId={record.country_id} filterable />
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
          attemptCount={maxAttemptCountForEvent(record.event_id)}
        />
      )}
    </Table.Row>
  );
}
