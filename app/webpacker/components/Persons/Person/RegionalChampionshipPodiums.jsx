import React from 'react';
import {
  Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow,
} from 'semantic-ui-react';
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
      <TableRow>
        <TableCell colSpan={9}>
          <a
            href={competitionUrl(data.competition.id)}
            className="competition-link"
          >
            {data.competition.name}
          </a>
        </TableCell>
      </TableRow>
      {data.results.map(([result, podium]) => (
        <TableRow key={result.id} className="result">
          <TableCell className="event">
            <EventIcon id={result.eventId} />
            <I18nHTMLTranslate i18nKey={`events.${result.eventId}`} />
          </TableCell>
          <TableCell className="place">{podium.pos}</TableCell>
          <TableCell className="single">{formatAttemptResult(result.best, result.eventId)}</TableCell>
          <TableCell className="average">{formatAttemptResult(result.average, result.eventId)}</TableCell>
          {result.attempts.map((_, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <AttemptItem key={i} result={result} attemptNumber={i} />
          ))}
        </TableRow>
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
          <TableHeader>
            <TableRow>
              <TableHeaderCell className="event"><I18nHTMLTranslate i18nKey="competitions.results_table.event" /></TableHeaderCell>
              <TableHeaderCell className="place"><I18nHTMLTranslate i18nKey="persons.show.place" /></TableHeaderCell>
              <TableHeaderCell className="single"><I18nHTMLTranslate i18nKey="common.single" /></TableHeaderCell>
              <TableHeaderCell className="average"><I18nHTMLTranslate i18nKey="common.average" /></TableHeaderCell>
              <TableHeaderCell className="solves" colSpan={5}><I18nHTMLTranslate i18nKey="common.solves" /></TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {compAndResults.map((data) => (
              <CompetitionResults
                data={data}
                key={data.competition.id}
              />
            ))}
          </TableBody>
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
