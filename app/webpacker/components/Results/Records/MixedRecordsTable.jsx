import React, { useMemo } from 'react';
import { Header, Table } from 'semantic-ui-react';
import _ from 'lodash';
import { countries, events } from '../../../lib/wca-data.js.erb';
import { WCA_EVENT_IDS } from '../../wca/EventSelector';
import { RecordRow } from '../TableRows';
import { MixedHeader } from '../TableHeaders';

export default function MixedRecordsTable({
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

    return _.groupBy(r, 'result.eventId');
  }, [competitionsById, rows]);

  return (
    <div style={{ overflowX: 'scroll' }}>
      {WCA_EVENT_IDS.map((id) => (
        Object.keys(results).includes(id)
          && <RecordTable record={results[id]} eventId={id} />
      ))}
    </div>
  );
}

function RecordTable({ record, eventId }) {
  return (
    <>
      <Header>{events.byId[eventId].name}</Header>
      <Table basic="very" compact="very" striped unstackable singleLine>
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
      </Table>
    </>
  );
}
