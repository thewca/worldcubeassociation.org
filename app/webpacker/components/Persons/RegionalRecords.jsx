import React from 'react';
import {
  Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow,
} from 'semantic-ui-react';
import I18nHTMLTranslate from '../I18nHTMLTranslate';
import EventIcon from '../wca/EventIcon';
import { events } from '../../lib/wca-data.js.erb';

/* eslint-disable jsx-a11y/control-has-associated-label */

/**
 * @typedef {Object} Result
 * @property {number} id
 * @property {string} eventId
 * @property {string} best
 * @property {string} average
 * @property {string} competitionName
 * @property {string} competitionUrl
 * @property {string} roundTypeId
 * @property {number} bestIdx
 * @property {number} worstIdx
 * @property {string[]} attempts
 * @property {string} singleRecord
 * @property {string} averageRecord
* */

/**
 * @param results {Result[]}
 */
function groupByEvent(results) {
  const grouped = {};
  results.forEach((result) => {
    if (!grouped[result.eventId]) {
      grouped[result.eventId] = [];
    }
    grouped[result.eventId].push(result);
  });
  return grouped;
}

/**
 * @param result {Result}
 * @param attemptNumber {number}
 */
function AttemptItem({ result, attemptNumber }) {
  const attempt = result.attempts[attemptNumber];
  const best = result.bestIdx === attemptNumber;
  const worst = result.worstIdx === attemptNumber;

  const text = best || worst ? `(${attempt})` : attempt;
  return (<TableCell>{text}</TableCell>);
}

/**
 *
 * @param eventId {string}
 * @param results {Result[]}
 * @param recordTypes {string[]}
 */
function DrawEventResults({ eventId, results, recordTypes }) {
  return (
    <>
      <TableRow>
        <TableCell colSpan="9">
          <EventIcon id={eventId} />
          <I18nHTMLTranslate i18nKey={`events.${eventId}`} />
        </TableCell>
      </TableRow>
      {results.map((result) => (
        <TableRow key={result.id}>
          <TableCell>
            {recordTypes.includes(result.singleRecord) && result.best}
          </TableCell>
          <TableCell>
            {recordTypes.includes(result.averageRecord) && result.average}
          </TableCell>
          <TableCell>
            <a href={result.competitionUrl}>
              {result.competitionName}
            </a>
          </TableCell>
          <TableCell>
            <I18nHTMLTranslate i18nKey={`rounds.${result.roundTypeId}.cellName`} />
          </TableCell>
          {recordTypes.includes(result.averageRecord) ? result.attempts.map((_, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <AttemptItem key={i} result={result} attemptNumber={i} />
          )) : (
            <TableCell colSpan="5" />
          )}
        </TableRow>
      ))}
    </>
  );
}

const allEvents = events.official.map((event) => event.id);
Object.entries(events.byId).forEach((entry) => {
  if (allEvents.find((e) => e === entry[1].id)) return;
  allEvents.push(entry[1].id);
});

/**
 * @param results {Result[]}
 * @param title {string}
 * @param recordTypes {string[]}
 */
export default function RegionalRecords({ results, title, recordTypes }) {
  if (results.length === 0) return null;

  const groupedResults = groupByEvent(results);
  return (
    <div className="records">
      <h3 className="text-center">
        {title}
      </h3>
      <div style={{ overflowX: 'auto', marginBottom: '0.75rem' }}>
        <Table striped>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>
                <I18nHTMLTranslate i18nKey="common.single" />
              </TableHeaderCell>
              <TableHeaderCell>
                <I18nHTMLTranslate i18nKey="common.average" />
              </TableHeaderCell>
              <TableHeaderCell>
                <I18nHTMLTranslate i18nKey="persons.show.competition" />
              </TableHeaderCell>
              <TableHeaderCell>
                <I18nHTMLTranslate i18nKey="competitions.results_table.round" />
              </TableHeaderCell>
              <TableHeaderCell colSpan="5" textAlign="center">
                <I18nHTMLTranslate i18nKey="common.solves" />
              </TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allEvents.map((eventId) => {
              if (!groupedResults[eventId]) return null;
              return (
                <DrawEventResults
                  key={eventId}
                  eventId={eventId}
                  results={groupedResults[eventId]}
                  recordTypes={recordTypes}
                />
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
