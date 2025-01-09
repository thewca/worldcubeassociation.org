import React from 'react';
import {
  Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow,
} from 'semantic-ui-react';
import I18nHTMLTranslate from '../../I18nHTMLTranslate';
import EventIcon from '../../wca/EventIcon';
import { events } from '../../../lib/wca-data.js.erb';
import { AttemptItem } from './TableComponents';
import I18n from '../../../lib/i18n';
import { competitionUrl } from '../../../lib/requests/routes.js.erb';
import { formatAttemptResult } from '../../../lib/wca-live/attempts';

const allEvents = events.official.map((event) => event.id);
Object.entries(events.byId).forEach((entry) => {
  if (allEvents.find((e) => e === entry[1].id)) return;
  allEvents.push(entry[1].id);
});

const recordTypes = {
  worldRecords: {
    title: I18n.t('persons.show.world_records'),
    records: ['WR'],
  },
  continentalRecords: {
    title: I18n.t('persons.show.continental_records'),
    records: ['ER', 'NAR', 'SAR', 'AsR', 'OcR', 'AfR'],
  },
  nationalRecords: {
    title: I18n.t('persons.show.national_records'),
    records: ['NR'],
  },
};

function groupByTypeAndEvent(results) {
  const typeGroups = {};

  results.forEach((result) => {
    Object.entries(recordTypes).forEach(([recordGroup, groupData]) => {
      if (groupData.records.includes(result.regional_average_record)
        || groupData.records.includes(result.regional_single_record)) {
        let recordData = typeGroups[recordGroup];
        if (!recordData) {
          recordData = [];
          typeGroups[recordGroup] = recordData;
        }
        let eventResults = recordData[result.event_id];
        if (!eventResults) {
          eventResults = [];
          recordData[result.event_id] = eventResults;
        }
        eventResults.push(result);
      }
    });
  });

  return typeGroups;
}

function DrawEventResults({
  eventId, results, types, competitions,
}) {
  return (
    <>
      <TableRow>
        <TableCell colSpan="9">
          <EventIcon id={eventId} />
          <I18nHTMLTranslate i18nKey={`events.${eventId}`} />
        </TableCell>
      </TableRow>
      {results.map((result) => {
        const competition = competitions[result.competition_id];

        return (
          <TableRow key={result.id}>
            <TableCell>
              {types.includes(result.regional_single_record) && (
                formatAttemptResult(result.best, result.event_id)
              )}
            </TableCell>
            <TableCell>
              {types.includes(result.regional_average_record) && (
                formatAttemptResult(result.average, result.event_id)
              )}
            </TableCell>
            <TableCell>
              <a href={competitionUrl(competition.id)}>
                {competition.name}
              </a>
            </TableCell>
            <TableCell>
              <I18nHTMLTranslate i18nKey={`rounds.${result.round_type_id}.cellName`} />
            </TableCell>
            {types.includes(result.averageRecord) ? result.attempts.map((_, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <AttemptItem key={i} result={result} attemptNumber={i} />
            )) : (
              <TableCell colSpan="5" />
            )}
          </TableRow>
        );
      })}
    </>
  );
}

function RegionalRecordsOld({
  groupedResults, competitions, title, type,
}) {
  return (
    <div className="records">
      <h3 className="text-center">
        {title}
      </h3>
      <div style={{ overflowX: 'auto', marginBottom: '0.75rem' }}>
        <Table unstackable compact="very" singleLine basic="very" striped>
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
                  competitions={competitions}
                  types={recordTypes[type].records}
                />
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function RegionalRecords({ results, competitions }) {
  const groupedResults = groupByTypeAndEvent(results);
  return (
    <>
      {Object.keys(recordTypes).map((type) => groupedResults[type] && (
        <RegionalRecordsOld
          key={type}
          groupedResults={groupedResults[type]}
          competitions={competitions}
          title={recordTypes[type].title}
          type={type}
        />
      ))}
    </>
  );
}
