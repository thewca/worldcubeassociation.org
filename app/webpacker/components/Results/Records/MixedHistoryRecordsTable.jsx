import React from 'react';
import { Table } from 'semantic-ui-react';
import _ from 'lodash';
import { HistoryRow } from '../TableRows';
import { HistoryHeader } from '../TableHeaders';
import { augmentResults } from './utils';

export default function MixedHistoryRecordsTable({
  rows, competitionsById,
}) {
  const results = augmentResults(rows, competitionsById);

  return (
    <div style={{ overflowX: 'scroll' }}>
      <RecordTable record={results} />
    </div>
  );
}

function RecordTable({ record }) {
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
