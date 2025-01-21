import React, { useMemo } from 'react';
import { Header, Table } from 'semantic-ui-react';
import _ from 'lodash';
import { countries, events } from '../../../lib/wca-data.js.erb';
import { WCA_EVENT_IDS } from '../../wca/EventSelector';
import { HistoryRow, RecordRow } from '../TableRows';
import { HistoryHeader, MixedHeader } from '../TableHeaders';

export default function RecordsTable({
  rows, competitionsById, show,
}) {
  const results = useMemo(() => {
    const r = rows.map((result) => {
      const competition = competitionsById[result.competitionId];
      const country = countries.real.find((c) => c.id === result.countryId);

      return {
        result,
        competition,
        country,
        key: `${result.id}-${show}-${result.type}`,
      };
    });

    if (show !== 'mixed history') {
      return _.groupBy(r, 'result.eventId');
    }

    return r;
  }, [competitionsById, rows, show]);

  return (
    <div style={{ overflowX: 'scroll' }}>
      { show !== 'mixed history' ? WCA_EVENT_IDS.map((id) => Object.keys(results).includes(id)
          && <RecordTable record={results[id]} eventId={id} show={show} />)
        : <RecordTable record={results} show={show} />}
    </div>
  );
}

function RecordTable({ record, eventId, show }) {
  return (
    <>
      { show !== 'mixed history' && <Header>{events.byId[eventId].name}</Header>}
      <Table basic="very" compact="very" striped unstackable singleLine>
        { show === 'mixed' ? <MixedHeader /> : <HistoryHeader mixed={show === 'mixed history'} /> }
        <Table.Body>
          {record.map((r) => (show === 'mixed' ? (
            <RecordRow
              country={r.country}
              key={r.key}
              result={r.result}
              competition={r.competition}
              rank={r.rank}
              tiedPrevious={r.tiedPrevious}
            />
          ) : (
            <HistoryRow
              country={r.country}
              key={r.key}
              result={r.result}
              competition={r.competition}
              rank={r.rank}
              tiedPrevious={r.tiedPrevious}
              mixed={show === 'mixed history'}
            />
          )))}
        </Table.Body>
      </Table>
    </>
  );
}
