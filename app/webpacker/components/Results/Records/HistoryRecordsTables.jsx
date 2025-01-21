import React from 'react';
import { Header, Table } from 'semantic-ui-react';
import _ from 'lodash';
import { events } from '../../../lib/wca-data.js.erb';
import { WCA_EVENT_IDS } from '../../wca/EventSelector';
import { HistoryRow } from '../TableRows';
import { HistoryHeader } from '../TableHeaders';
import { augmentAndGroupResults } from './utils';
import RecordsTable from '../RecordsTable';

export default function HistoryRecordsTables({
  rows, competitionsById,
}) {
  const results = augmentAndGroupResults(rows, competitionsById);

  return (
    <div style={{ overflowX: 'scroll' }}>
      {WCA_EVENT_IDS
        .filter((id) => Object.keys(results).includes(id))
        .map((id) => <HistoryRecordsTable record={results[id]} eventId={id} />
      )}
    </div>
  );
}

function HistoryRecordsTable({ record, eventId }) {
  return (
    <>
      <Header>{events.byId[eventId].name}</Header>
      <RecordsTable>
        <HistoryHeader mixed={false} />
        <Table.Body>
          {record.map((r) => (
            <HistoryRow
              country={r.country}
              key={r.key}
              result={r.result}
              competition={r.competition}
              rank={r.rank}
              tiedPrevious={r.tiedPrevious}
              isMixed={false}
            />
          ))}
        </Table.Body>
      </RecordsTable>
    </>
  );
}
