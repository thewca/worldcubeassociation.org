import React from 'react';
import { Table } from 'semantic-ui-react';
import I18nHTMLTranslate from '../../I18nHTMLTranslate';
import EventIcon from '../../wca/EventIcon';
import { AttemptItem } from './TableComponents';
import I18n from '../../../lib/i18n';
import { competitionUrl } from '../../../lib/requests/routes.js.erb';
import { formatAttemptResult } from '../../../lib/wca-live/attempts';

function CompetitionResults({
  data,
}) {
  return (
    <>
      <Table.Row>
        <Table.Cell colSpan={9}>
          <a
            href={competitionUrl(data.competition.id)}
            className="competition-link"
          >
            {data.competition.name}
          </a>
        </Table.Cell>
      </Table.Row>
      {data.results.map(([result, podium]) => (
        <Table.Row key={result.id} className="result">
          <Table.Cell className="event">
            <EventIcon id={result.event_id} />
            <I18nHTMLTranslate i18nKey={`events.${result.event_id}`} />
          </Table.Cell>
          <Table.Cell className="place">{podium.pos}</Table.Cell>
          <Table.Cell className="single">{formatAttemptResult(result.best, result.event_id)}</Table.Cell>
          <Table.Cell className="average">{formatAttemptResult(result.average, result.event_id)}</Table.Cell>
          {result.attempts.map((_, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <AttemptItem key={i} result={result} attemptNumber={i} />
          ))}
        </Table.Row>
      ))}
    </>
  );
}

function getResultsForComp(podiums, results, competitions) {
  const grouped = {};
  podiums.forEach((podium) => {
    const compId = podium.competition_id;
    const matchedResult = results.find((result) => result.id === podium.id);
    if (!grouped[compId]) {
      grouped[compId] = {
        competition: competitions[matchedResult.competition_id],
        results: [],
      };
    }
    grouped[compId].results.push([matchedResult, podium]);
  });

  return Object
    .values(grouped)
    .sort((a, b) => new Date(a.competition.start_date) - new Date(b.competition.start_date));
}

function RegionalChampionshipPodiumsOld({
  results,
  title,
  podiums,
  competitions,
}) {
  const compAndResults = getResultsForComp(podiums, results, competitions);
  return (
    <div className="wc-podiums">
      <h3 className="text-center">{title}</h3>
      <div style={{ overflowX: 'auto', marginBottom: '0.75rem' }}>
        <Table striped unstackable singleLine basic="very" compact="very">
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell className="event"><I18nHTMLTranslate i18nKey="competitions.results_table.event" /></Table.HeaderCell>
              <Table.HeaderCell className="place"><I18nHTMLTranslate i18nKey="persons.show.place" /></Table.HeaderCell>
              <Table.HeaderCell className="single"><I18nHTMLTranslate i18nKey="common.single" /></Table.HeaderCell>
              <Table.HeaderCell className="average"><I18nHTMLTranslate i18nKey="common.average" /></Table.HeaderCell>
              <Table.HeaderCell className="solves" colSpan={5}><I18nHTMLTranslate i18nKey="common.solves" /></Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {compAndResults.map((data) => (
              <CompetitionResults
                data={data}
                key={data.competition.id}
              />
            ))}
          </Table.Body>
        </Table>
      </div>
    </div>
  );
}

const championshipTypes = {
  world: {
    title: I18n.t('persons.show.championship_podium_levels.world'),
    type: 'world',
  },
  continental: {
    title: I18n.t('persons.show.championship_podium_levels.continental'),
    type: 'continental',
  },
  greaterChina: {
    title: I18n.t('persons.show.championship_podium_levels.greater_china'),
    type: 'greater_china',
  },
  national: {
    title: I18n.t('persons.show.championship_podium_levels.national'),
    type: 'national',
  },
};

export default function RegionalChampionshipPodiums({ results, championshipPodiums, competitions }) {
  return (
    <>
      {Object.entries(championshipTypes).map((
        [type, { title }],
      ) => championshipPodiums[type]?.length > 0 && (
        <RegionalChampionshipPodiumsOld
          key={type}
          results={results}
          title={title}
          podiums={championshipPodiums[type]}
          competitions={competitions}
        />
      ))}
    </>
  );
}
