import React from 'react';
import { Header, Table } from 'semantic-ui-react';
import { events, WCA_EVENT_IDS } from '../../../lib/wca-data.js.erb';
import { RecordRow } from '../TableRows';
import { MixedHeader } from '../TableHeaders';
import { augmentAndGroupResults } from './utils';
import RecordsTable from '../RecordsTable';

export default function MixedRecordsTables({
  rows, competitionsById,
}) {
  const results = augmentAndGroupResults(rows, competitionsById);

  return (
    <div style={{ overflowX: 'scroll' }}>
      {WCA_EVENT_IDS
        .filter((id) => Object.keys(results).includes(id))
        .map((id) => <MixedRecordsTable record={results[id]} eventId={id} />)}
    </div>
  );
}

function MixedRecordsTable({ record, eventId }) {
  return (
    <>
      <Header>{events.byId[eventId].name}</Header>
      <RecordsTable>
        <MixedHeader />
        <Table.Body>
          {record.map((r) => (
            <RecordRow
              country={r.country}
              key={r.key}
              result={r.result}
              competition={r.competition}
              rank={r.rank}
              tiedPrevious={r.tiedPrevious}
            />
          ))}
        </Table.Body>
      </RecordsTable>
    </>
  );
}
