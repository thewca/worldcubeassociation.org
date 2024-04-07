import React from 'react';
import {
  Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow,
} from 'semantic-ui-react';
import I18nHTMLTranslate from '../I18nHTMLTranslate';
import EventIcon from '../wca/EventIcon';
import { AttemptItem } from './TableComponents';

function CompetitionResults({
  competition,
}) {
  return (
    <>
      <TableRow>
        <TableCell colSpan={9}>
          <a
            href={competition.url}
            className="competition-link"
          >
            {competition.name}
          </a>
        </TableCell>
      </TableRow>
      {competition.results.map((result) => (
        <TableRow key={result.id} className="result">
          <TableCell className="event">
            <EventIcon id={result.eventId} />
            <I18nHTMLTranslate i18nKey={`events.${result.eventId}`} />
          </TableCell>
          <TableCell className="place">{result.pos}</TableCell>
          <TableCell className="single">{result.single}</TableCell>
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

export default function RegionalChampionshipPodiums({
  title,
  competitions,
}) {
  return (
    <div className="wc-podiums">
      <h3 className="text-center">{title}</h3>
      <div style={{ overflowX: 'auto', marginBottom: '0.75rem' }}>
        <Table striped>
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
            {competitions.map((competition) => (
              <CompetitionResults competition={competition} key={competition.id} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
