import React from 'react';
import { Table } from 'semantic-ui-react';
import _ from 'lodash';
import I18n from '../../../lib/i18n';
import { formatAttemptResult } from '../../../lib/wca-live/attempts';
import { events } from '../../../lib/wca-data.js.erb';
import { personUrl } from '../../../lib/requests/routes.js.erb';
import EventIcon from '../../wca/EventIcon';

export default function SlimRecordsTable({ records }) {
  return (
    <Table basic="very" compact="very" striped unstackable>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>{I18n.t('results.table_elements.name')}</Table.HeaderCell>
          <Table.HeaderCell>{I18n.t('common.single')}</Table.HeaderCell>
          <Table.HeaderCell>{I18n.t('results.table_elements.event')}</Table.HeaderCell>
          <Table.HeaderCell>{I18n.t('common.average')}</Table.HeaderCell>
          <Table.HeaderCell>{I18n.t('results.table_elements.name')}</Table.HeaderCell>
          <Table.HeaderCell>{I18n.t('results.table_elements.solves')}</Table.HeaderCell>
          <Table.HeaderCell />
          <Table.HeaderCell />
          <Table.HeaderCell />
          <Table.HeaderCell />
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {records[0].map((row) => {
          const [single, average] = row;
          const attempts = [average?.value1, average?.value2, average?.value3, average?.value4, average?.value5];
          const bestResult = _.max(attempts);
          const worstResult = _.min(attempts);
          const bestResultIndex = attempts.indexOf(bestResult);
          const worstResultIndex = attempts.indexOf(worstResult);
          return (
            <Table.Row>
              <Table.Cell>
                <a href={personUrl(single.personId)}>{single.personName}</a>
              </Table.Cell>
              <Table.Cell>
                {formatAttemptResult(single.value, single.eventId)}
              </Table.Cell>
              <Table.Cell>
                <EventIcon id={single.eventId} />
                {' '}
                {events.byId[single.eventId].name}
              </Table.Cell>
              {average && (
                <>
                  <Table.Cell>
                    {formatAttemptResult(average.value, average.eventId)}
                  </Table.Cell>
                  <Table.Cell>
                    <a href={personUrl(average.personId)}>{average.personName}</a>
                  </Table.Cell>
                  {attempts.map((a, i) => (
                    <Table.Cell>
                      { attempts.filter(Boolean).length === 5
                      && (i === bestResultIndex || i === worstResultIndex)
                        ? `(${formatAttemptResult(a, average.eventId)})` : formatAttemptResult(a, average.eventId)}
                    </Table.Cell>
                  ))}
                </>
              )}
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table>
  );
}
