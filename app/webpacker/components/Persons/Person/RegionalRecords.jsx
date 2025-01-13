import React from 'react';
import { Table } from 'semantic-ui-react';
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
      <Table.Row>
        <Table.Cell colSpan="9">
          <EventIcon id={eventId} />
          <I18nHTMLTranslate i18nKey={`events.${eventId}`} />
        </Table.Cell>
      </Table.Row>
      {results.map((result) => {
        const competition = competitions[result.competition_id];

        return (
          <Table.Row key={result.id}>
            <Table.Cell>
              {types.includes(result.regional_single_record) && (
                formatAttemptResult(result.best, result.event_id)
              )}
            </Table.Cell>
            <Table.Cell>
              {types.includes(result.regional_average_record) && (
                formatAttemptResult(result.average, result.event_id)
              )}
            </Table.Cell>
            <Table.Cell>
              <a href={competitionUrl(competition.id)}>
                {competition.name}
              </a>
            </Table.Cell>
            <Table.Cell>
              <I18nHTMLTranslate i18nKey={`rounds.${result.round_type_id}.cellName`} />
            </Table.Cell>
            {types.includes(result.averageRecord) ? result.attempts.map((_, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <AttemptItem key={i} result={result} attemptNumber={i} />
            )) : (
              <Table.Cell colSpan="5" />
            )}
          </Table.Row>
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
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>
                <I18nHTMLTranslate i18nKey="common.single" />
              </Table.HeaderCell>
              <Table.HeaderCell>
                <I18nHTMLTranslate i18nKey="common.average" />
              </Table.HeaderCell>
              <Table.HeaderCell>
                <I18nHTMLTranslate i18nKey="persons.show.competition" />
              </Table.HeaderCell>
              <Table.HeaderCell>
                <I18nHTMLTranslate i18nKey="competitions.results_table.round" />
              </Table.HeaderCell>
              <Table.HeaderCell colSpan="5" textAlign="center">
                <I18nHTMLTranslate i18nKey="common.solves" />
              </Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
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
          </Table.Body>
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
