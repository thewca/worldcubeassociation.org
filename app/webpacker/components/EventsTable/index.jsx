import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'semantic-ui-react';
import i18n from '../../lib/i18n';
import { attemptResultToString } from '../../lib/utils/edit-events';
import { attemptTypeById, centisecondsToClockFormat } from '../../lib/wca-live/attempts';
import { events, formats } from '../../lib/wca-data.js.erb';
import { eventQualificationToString, parseActivityCode } from '../../lib/utils/wcif';

export default function EventsTable({ competitionInfo, wcifEvents }) {
  return (
    <Table striped>
      <TableHeader>
        <TableRow>
          <TableHeaderCell>
            {i18n.t('competitions.results_table.event')}
          </TableHeaderCell>
          <TableHeaderCell>
            {i18n.t('competitions.results_table.round')}
          </TableHeaderCell>
          <TableHeaderCell>
            <a href="#format">{i18n.t('competitions.events.format')}</a>
          </TableHeaderCell>
          <TableHeaderCell>
            <a href="#time-limit">{i18n.t('competitions.events.time_limit')}</a>
          </TableHeaderCell>
          {competitionInfo['uses_cutoff?'] && (
            <TableHeaderCell>
              <a href="#cutoff">{i18n.t('competitions.events.cutoff')}</a>
            </TableHeaderCell>
          )}
          <TableHeaderCell>
            {i18n.t('competitions.events.proceed')}
          </TableHeaderCell>
          {competitionInfo['uses_qualification?'] && (
            <TableHeaderCell>
              {i18n.t('competitions.events.qualification')}
            </TableHeaderCell>
          )}
        </TableRow>
      </TableHeader>

      <TableBody>
        {wcifEvents.map((event) => event.rounds.map((round, i) => (
          <TableRow key={round.id}>
            <TableCell>
              {i === 0 && events.byId[event.id].name}
            </TableCell>
            <TableCell>{i18n.t(`rounds.${parseActivityCode(round.id).roundNumber}.cellName`)}</TableCell>
            <TableCell>
              {round.cutoff && `${formats.byId[round.cutoff.numberOfAttempts].shortName} / `}
              {formats.byId[round.format].shortName}
            </TableCell>
            <TableCell>
              {round.timeLimit
                && centisecondsToClockFormat(
                  round.timeLimit.centiseconds,
                )}
            </TableCell>
            {competitionInfo['uses_cutoff?'] && (
              <TableCell>
                {round.cutoff
                  && i18n.t(
                    `cutoff.${attemptTypeById(event.id)}`,
                    {
                      time: attemptResultToString(round.cutoff.attemptResult, event.id),
                      moves: attemptResultToString(round.cutoff.attemptResult, event.id),
                      points: attemptResultToString(round.cutoff.attemptResult, event.id),
                      count: round.cutoff.numberOfAttempts,
                    },
                  )}
              </TableCell>
            )}
            <TableCell>
              {round.advancementCondition
                && i18n.t(`advancement_condition.${round.advancementCondition.type}`, { ranking: round.advancementCondition.level, percent: round.advancementCondition.level })}
            </TableCell>
            {competitionInfo['uses_qualification?'] && (
              <TableCell>
                { i === 0
                && eventQualificationToString(event, event.qualification, { short: true })}
              </TableCell>
            )}
          </TableRow>
        )))}
      </TableBody>
    </Table>
  );
}
