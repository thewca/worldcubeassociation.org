import React, { useMemo } from 'react';
import { Table } from 'semantic-ui-react';
import _ from 'lodash';
import { countries } from '../../../lib/wca-data.js.erb';
import { HistoryRow } from '../TableRows';
import { HistoryHeader } from '../TableHeaders';

export default function MixedHistoryRecordsTable({
  rows, competitionsById,
}) {
  const results = useMemo(() => {
    const r = rows.map((result) => {
      const competition = competitionsById[result.competitionId];
      const country = countries.real.find((c) => c.id === result.countryId);

      return {
        result,
        competition,
        country,
        key: `${result.id}-${result.type}`,
      };
    });

    return r;
  }, [competitionsById, rows]);

  return (
    <div style={{ overflowX: 'scroll' }}>
      <RecordTable record={results} />
    </div>
  );
}

function RecordTable({ record, eventId }) {
  return (
    <>
      <Table basic="very" compact="very" striped unstackable singleLine>
        <HistoryHeader mixed />
        <Table.Body>
          {record.map((r) => (
            <HistoryRow
              country={r.country}
              key={r.key}
              result={r.result}
              competition={r.competition}
              rank={r.rank}
              tiedPrevious={r.tiedPrevious}
              mixed
            />
          ))}
        </Table.Body>
      </Table>
    </>
  );
}
