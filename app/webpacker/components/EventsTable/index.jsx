import { getEventName, getFormatName } from '@wca/helpers';
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
import { attemptResultToString, centisecondsToString } from '../../lib/utils/edit-events';

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
          <TableHeaderCell>{i18n.t('competitions.events.format')}</TableHeaderCell>
          <TableHeaderCell>
            {i18n.t('competitions.events.time_limit')}
          </TableHeaderCell>
          {competitionInfo['uses_cutoff?'] && (
            <TableHeaderCell>
              {i18n.t('competitions.events.cutoff')}
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
            <TableCell
              className={
                i === event.rounds.length - 1 ? 'last-round' : ''
              }
            >
              {i === 0 && getEventName(event.id)}
            </TableCell>
            <TableCell>{i + 1}</TableCell>
            <TableCell>{getFormatName(round.format)}</TableCell>
            <TableCell>
              {round.timeLimit
                && centisecondsToString(
                  round.timeLimit.centiseconds,
                )}
            </TableCell>
            {competitionInfo['uses_cutoff?'] && (
              <TableCell>
                {round.cutoff
                  && attemptResultToString(
                    round.cutoff.attemptResult,
                    event.id,
                  )}
              </TableCell>
            )}
            <TableCell>
              {round.advancementCondition
                && `Top ${round.advancementCondition.level} ${round.advancementCondition.type} proceed`}
            </TableCell>
            {competitionInfo['uses_qualification?'] && (
              <TableCell>{event.qualification}</TableCell>
            )}
          </TableRow>
        )))}
      </TableBody>
    </Table>
  );
}
