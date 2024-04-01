import React from 'react';
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
  let componentClass = `solve ${attemptNumber}`;

  const best = result.bestIdx === attemptNumber;
  const worst = result.worstIdx === attemptNumber;

  if (best || worst) componentClass += ' trimmed';
  if (best) componentClass += ' best';
  if (worst) componentClass += ' worst';

  return (<td className={componentClass}>{attempt}</td>);
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
      <tr>
        <td colSpan="9" className="event">
          <EventIcon id={eventId} />
          <I18nHTMLTranslate i18nKey={`events.${eventId}`} />
        </td>
      </tr>
      {results.map((result) => (
        <tr className="result" key={result.id}>
          <td className="single">
            {recordTypes.includes(result.singleRecord) && result.best}
          </td>
          <td className="average">
            {recordTypes.includes(result.averageRecord) && result.average}
          </td>
          <td className="competition">
            <a href={result.competitionUrl}>
              {result.competitionName}
            </a>
          </td>
          <td className="round">
            <I18nHTMLTranslate i18nKey={`rounds.${result.roundTypeId}.cellName`} />
          </td>
          {recordTypes.includes(result.averageRecord) ? result.attempts.map((_, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <AttemptItem key={i} result={result} attemptNumber={i} />
          )) : (
            <td colSpan="5" />
          )}
        </tr>
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
      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th className="single">
                <I18nHTMLTranslate i18nKey="common.single" />
              </th>
              <th className="average">
                <I18nHTMLTranslate i18nKey="common.average" />
              </th>
              <th className="competition">
                <I18nHTMLTranslate i18nKey="persons.show.competition" />
              </th>
              <th className="round">
                <I18nHTMLTranslate i18nKey="competitions.results_table.round" />
              </th>
              <th className="solves" colSpan="5">
                <I18nHTMLTranslate i18nKey="common.solves" />
              </th>
            </tr>
          </thead>
          <tbody>
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
          </tbody>
        </table>
      </div>
    </div>
  );
}
