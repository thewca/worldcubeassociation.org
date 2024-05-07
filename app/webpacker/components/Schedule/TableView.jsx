import { DateTime } from 'luxon';
import React, { useState } from 'react';
import {
  Checkbox, Header, Segment, Table, TableCell,
} from 'semantic-ui-react';
import {
  activitiesOnDate,
  earliestWithLongestTieBreaker,
  getActivityEventId,
  getActivityRoundId,
  groupActivities, localizeActivityName,
} from '../../lib/utils/activities';
import { getSimpleTimeString } from '../../lib/utils/dates';
import { toDegrees } from '../../lib/utils/edit-schedule';
import AddToCalendar from './AddToCalendar';
import i18n from '../../lib/i18n';
import { formats } from '../../lib/wca-data.js.erb';
import { attemptTypeById, centisecondsToClockFormat } from '../../lib/wca-live/attempts';
import { attemptResultToString } from '../../lib/utils/edit-events';
import { parseActivityCode } from '../../lib/utils/wcif';

export default function TableView({
  dates,
  timeZone,
  activeRooms,
  activeEvents,
  activeVenueOrNull,
  competitionName,
}) {
  const activeRounds = activeEvents.flatMap((event) => event.rounds);

  const [isExpanded, setIsExpanded] = useState(false);

  const sortedActivities = activeRooms
    .flatMap((room) => room.activities)
    .toSorted(earliestWithLongestTieBreaker);

  const eventIds = activeEvents.map(({ id }) => id);
  const visibleActivities = sortedActivities.filter((activity) => ['other', ...eventIds].includes(getActivityEventId(activity)));

  return (
    <>
      <Checkbox
        name="details"
        label={i18n.t('competitions.schedule.more_details')}
        toggle
        checked={isExpanded}
        onChange={(_, data) => setIsExpanded(data.checked)}
      />

      {dates.map((date) => {
        const activitiesForDay = activitiesOnDate(
          visibleActivities,
          date,
          timeZone,
        );
        const groupedActivitiesForDay = groupActivities(activitiesForDay);

        return (
          <SingleDayTable
            key={date.toMillis()}
            date={date}
            timeZone={timeZone}
            groupedActivities={groupedActivitiesForDay}
            events={activeEvents}
            rounds={activeRounds}
            rooms={activeRooms}
            isExpanded={isExpanded}
            activeVenueOrNull={activeVenueOrNull}
            competitionName={competitionName}
          />
        );
      })}
    </>
  );
}

function SingleDayTable({
  date,
  timeZone,
  groupedActivities,
  events,
  rounds,
  rooms,
  isExpanded,
  activeVenueOrNull,
  competitionName,
}) {
  const title = i18n.t('competitions.schedule.schedule_for_full_date', { date: date.toLocaleString(DateTime.DATE_HUGE) });

  const hasActivities = groupedActivities.length > 0;
  const startTime = hasActivities && groupedActivities[0][0].startTime;
  const endTime = hasActivities && groupedActivities[groupedActivities.length - 1][0].endTime;
  const activeVenueAddress = activeVenueOrNull
    && `${toDegrees(activeVenueOrNull.latitudeMicrodegrees)},${toDegrees(
      activeVenueOrNull.longitudeMicrodegrees,
    )}`;

  return (
    <Segment basic>
      <Header as="h2">
        {hasActivities && (
          <AddToCalendar
            startDate={startTime}
            endDate={endTime}
            timeZone={timeZone}
            name={competitionName}
            address={activeVenueAddress}
          />
        )}
        {hasActivities && ' '}
        {title}
      </Header>

      <Table striped>
        <Table.Header>
          <HeaderRow isExpanded={isExpanded} />
        </Table.Header>

        <Table.Body>
          {hasActivities ? (
            groupedActivities.map((activityGroup) => {
              const activityRound = rounds.find(
                (round) => round.id === getActivityRoundId(activityGroup[0]),
              );

              return (
                <ActivityRow
                  key={activityGroup[0].id}
                  isExpanded={isExpanded}
                  activityGroup={activityGroup}
                  events={events}
                  round={activityRound}
                  rooms={rooms}
                  timeZone={timeZone}
                />
              );
            })
          ) : (
            <Table.Row>
              <Table.Cell colSpan={4}>
                <em>{i18n.t('competitions.schedule.no_activities')}</em>
              </Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table>
    </Segment>
  );
}

function HeaderRow({ isExpanded }) {
  return (
    <Table.Row>
      <Table.HeaderCell>{i18n.t('competitions.schedule.start')}</Table.HeaderCell>
      <Table.HeaderCell>{i18n.t('competitions.schedule.end')}</Table.HeaderCell>
      <Table.HeaderCell>{i18n.t('competitions.schedule.activity')}</Table.HeaderCell>
      <Table.HeaderCell>{i18n.t('competitions.schedule.room_or_stage')}</Table.HeaderCell>
      {isExpanded && (
        <>
          <Table.HeaderCell>{i18n.t('competitions.events.format')}</Table.HeaderCell>
          <Table.HeaderCell><a href="#time-limit">{i18n.t('competitions.events.time_limit')}</a></Table.HeaderCell>
          <Table.HeaderCell><a href="#cutoff">{i18n.t('competitions.events.cutoff')}</a></Table.HeaderCell>
          <Table.HeaderCell>{i18n.t('competitions.events.proceed')}</Table.HeaderCell>
        </>
      )}
    </Table.Row>
  );
}

function ActivityRow({
  isExpanded,
  activityGroup,
  events,
  round,
  rooms,
  timeZone,
}) {
  const representativeActivity = activityGroup[0];

  const name = representativeActivity.activityCode.startsWith('other') ? representativeActivity.name : localizeActivityName(representativeActivity, events);
  const { startTime, endTime } = representativeActivity;

  const activityIds = activityGroup.map((activity) => activity.id);

  // note: round may be undefined for custom activities like lunch
  const {
    format, timeLimit, cutoff, advancementCondition,
  } = round || {};
  const roomsUsed = rooms.filter(
    (room) => room.activities.some((activity) => activityIds.includes(activity.id)),
  );
  const { eventId } = cutoff ? parseActivityCode(round.id) : {};

  return (
    <Table.Row>
      <Table.Cell>{getSimpleTimeString(startTime, timeZone)}</Table.Cell>

      <Table.Cell>{getSimpleTimeString(endTime, timeZone)}</Table.Cell>

      <Table.Cell>{name}</Table.Cell>

      <Table.Cell>{roomsUsed.map((room) => room.name).join(', ')}</Table.Cell>

      {isExpanded && (
        <>
          <Table.Cell>
            {cutoff && format && `${formats.byId[cutoff.numberOfAttempts].shortName} / `}
            {format && formats.byId[format].shortName}
          </Table.Cell>

          <TableCell>
            {timeLimit
              && centisecondsToClockFormat(
                timeLimit.centiseconds,
              )}
          </TableCell>

          <TableCell>
            {cutoff
              && i18n.t(
                `cutoff.${attemptTypeById(eventId)}`,
                {
                  time: attemptResultToString(cutoff.attemptResult, eventId),
                  moves: attemptResultToString(cutoff.attemptResult, eventId),
                  points: attemptResultToString(cutoff.attemptResult, eventId),
                  count: cutoff.numberOfAttempts,
                },
              )}
          </TableCell>

          <TableCell>
            {advancementCondition
              && i18n.t(`advancement_condition.${advancementCondition.type}`, { ranking: advancementCondition.level, percent: advancementCondition.level })}
          </TableCell>
        </>
      )}
    </Table.Row>
  );
}
