import React from 'react';
import { Segment, Table } from 'semantic-ui-react';
import _ from 'lodash';
import { countries, events } from '../../lib/wca-data.js.erb';
import I18n from '../../lib/i18n';
import { formatAttemptResult } from '../../lib/wca-live/attempts';
import { competitionAllResultsUrl, personUrl } from '../../lib/requests/routes.js.erb';
import EventIcon from '../wca/EventIcon';

export default function WinnerTable({ results, competition }) {
  return (
    <Segment style={{ overflowX: 'scroll' }}>
      <Table striped compact="very" singleLine unstackable basic>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>
              {I18n.t('competitions.results_table.event')}
            </Table.HeaderCell>
            <Table.HeaderCell>
              {I18n.t('competitions.results_table.name')}
            </Table.HeaderCell>
            <Table.HeaderCell textAlign="right">
              {I18n.t('common.best')}
            </Table.HeaderCell>
            <Table.HeaderCell />
            <Table.HeaderCell textAlign="right">
              {I18n.t('common.average')}
            </Table.HeaderCell>
            <Table.HeaderCell />
            <Table.HeaderCell>
              {I18n.t('common.user.representing')}
            </Table.HeaderCell>
            <Table.HeaderCell>
              {I18n.t('common.solves')}
            </Table.HeaderCell>
            <Table.HeaderCell />
            <Table.HeaderCell />
            <Table.HeaderCell />
            <Table.HeaderCell />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {results.map((r) => {
            const attempts = [r.value1, r.value2, r.value3, r.value4, r.value5];
            const bestResult = _.max(attempts);
            const worstResult = _.min(attempts);
            const bestResultIndex = attempts.findIndex((a) => a === bestResult);
            const worstResultIndex = attempts.findIndex((a) => a === worstResult);
            return (
              <Table.Row>
                <Table.Cell>
                  <a href={competitionAllResultsUrl(competition.id, r.event.id)}>
                    {' '}
                    <EventIcon id={r.event.id} />
                    {' '}
                    {events.byId[r.event.id].name}
                  </a>
                </Table.Cell>
                <Table.Cell>
                  <a href={personUrl(r.personId)}>{r.personName}</a>
                </Table.Cell>
                <Table.Cell textAlign="right">{formatAttemptResult(r.best, r.event.id)}</Table.Cell>
                <Table.Cell>{r.regionalSingleRecord}</Table.Cell>
                <Table.Cell textAlign="right">{formatAttemptResult(r.average, r.event.id)}</Table.Cell>
                <Table.Cell>{r.regionalAverageRecord}</Table.Cell>
                <Table.Cell>{countries.byIso2[r.country.iso2].name}</Table.Cell>
                {attempts.map((a, i) => (
                  <Table.Cell>
                    { r.format.expected_solve_count === 5
                  && (i === bestResultIndex || i === worstResultIndex)
                      ? `(${formatAttemptResult(a, r.event.id)})` : formatAttemptResult(a, r.event.id)}
                  </Table.Cell>
                ))}
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    </Segment>
  );
}
