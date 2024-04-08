import React from 'react';
import {
  Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow,
} from 'semantic-ui-react';
import I18nHTMLTranslate from '../../I18nHTMLTranslate';
import EventIcon from '../../wca/EventIcon';
import { AttemptItem } from '../TableComponents';
import I18n from '../../../lib/i18n';

function CompetitionResults({
  data,
}) {
  return (
    <>
      <TableRow>
        <TableCell colSpan={9}>
          <a
            href={data.competition.url}
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
          <TableCell className="single">{result.best}</TableCell>
          <TableCell className="average">{result.average}</TableCell>
          {result.attempts.map((_, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <AttemptItem key={i} result={result} attemptNumber={i} />
          ))}
        </TableRow>
      ))}
    </>
  );
}

function getResultsForComp(podiums, person) {
  const grouped = {};
  podiums.forEach((podium) => {
    const compId = podium.competition_id;
    const matchedResult = person.results.find((result) => result.id === podium.id);
    if (!grouped[compId]) {
      grouped[compId] = {
        competition: matchedResult.competition,
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
  person,
  title,
  podiums,
}) {
  const compAndResults = getResultsForComp(podiums, person);
  return (
    <div className="wc-podiums">
      <h3 className="text-center">{title}</h3>
      <div style={{ overflowX: 'auto', marginBottom: '0.75rem' }}>
        <Table striped unstackable>
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
              <CompetitionResults data={data} key={data.competition.id} />
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

export default function RegionalChampionshipPodiums({ person }) {
  return (
    <>
      {Object.entries(championshipTypes).map((
        [type, { title }],
      ) => person.championshipPodiums[type]?.length > 0 && (
        <RegionalChampionshipPodiumsOld
          key={type}
          person={person}
          title={title}
          podiums={person.championshipPodiums[type]}
        />
      ))}
    </>
  );
}
