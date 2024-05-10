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
import { events, formats } from '../../lib/wca-data.js.erb';
import {
  advancementConditionToString,
  cutoffToString,
  eventQualificationToString,
  getRoundTypeId,
  timeLimitToString,
} from '../../lib/utils/wcif';

export default function EventsTable({ competitionInfo, wcifEvents }) {
  return (
    <div style={{ overflowX: 'scroll' }}>
      <Table striped selectable compact unstackable>
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
              {i === 0 && (
                <TableCell rowSpan={event.rounds.length}>
                  {events.byId[event.id].name}
                </TableCell>
              )}
              <TableCell>{i18n.t(`rounds.${getRoundTypeId(i + 1, event.rounds.length, Boolean(round.cutoff))}.cellName`)}</TableCell>
              <TableCell>
                {round.cutoff && `${formats.byId[round.cutoff.numberOfAttempts].shortName} / `}
                {formats.byId[round.format].shortName}
              </TableCell>
              <TableCell>
                {timeLimitToString(round, wcifEvents)}
                {round.timeLimit !== null && (
                  <>
                    {round.timeLimit.cumulativeRoundIds.length === 1 && (
                      <a href="#cumulative-time-limit">*</a>
                    )}
                    {round.timeLimit.cumulativeRoundIds.length > 1 && (
                      <a href="#cumulative-across-rounds-time-limit">**</a>
                    )}
                  </>
                )}
              </TableCell>
              {competitionInfo['uses_cutoff?'] && (
                <TableCell>
                  {round.cutoff
                    && cutoffToString(round)}
                </TableCell>
              )}
              <TableCell>
                {round.advancementCondition
                  && advancementConditionToString(round)}
              </TableCell>
              {competitionInfo['uses_qualification?'] && (
                <TableCell>
                  { i === 0
                  && eventQualificationToString(event, event.qualification)}
                </TableCell>
              )}
            </TableRow>
          )))}
        </TableBody>
      </Table>
    </div>
  );
}
