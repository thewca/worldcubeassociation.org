import { DateTime } from 'luxon';
import React from 'react';
import {
  Checkbox, Grid, Header, Icon, Segment,
} from 'semantic-ui-react';
import cn from 'classnames';
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
import useStoredState from '../../lib/hooks/useStoredState';
import i18n from '../../lib/i18n';
import { formats } from '../../lib/wca-data.js.erb';
import {
  parseActivityCode,
  timeLimitToString,
  advancementConditionToString,
  cutoffToString,
} from '../../lib/utils/wcif';
import '../../stylesheets/schedule_events.scss';

export default function TableView({
  dates,
  timeZone,
  activeRooms,
  activeEvents,
  activeVenueOrNull,
  competitionName,
  wcifEvents,
}) {
  const activeRounds = activeEvents.flatMap((event) => event.rounds);

  const [isExpanded, setIsExpanded] = useStoredState(true, 'scheduleTableExpanded');

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
            rounds={activeRounds}
            rooms={activeRooms}
            isExpanded={isExpanded}
            activeVenueOrNull={activeVenueOrNull}
            competitionName={competitionName}
            wcifEvents={wcifEvents}
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
  rounds,
  rooms,
  isExpanded,
  activeVenueOrNull,
  competitionName,
  wcifEvents,
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

      <Grid centered divided="vertically" className="schedule-events">
        <HeaderRow isExpanded={isExpanded} />

        {hasActivities ? (
          groupedActivities.map((activityGroup) => {
            const representativeActivity = activityGroup[0];

            const activityRound = rounds.find(
              (round) => round.id === getActivityRoundId(representativeActivity),
            );

            return (
              <ActivityRow
                key={representativeActivity.id}
                isExpanded={isExpanded}
                activityGroup={activityGroup}
                round={activityRound}
                rooms={rooms}
                timeZone={timeZone}
                wcifEvents={wcifEvents}
              />
            );
          })
        ) : (
          <Grid.Row columns={1}>
            <Grid.Column textAlign="center">
              <em>{i18n.t('competitions.schedule.no_activities')}</em>
            </Grid.Column>
          </Grid.Row>
        )}
      </Grid>
    </Segment>
  );
}

function HeaderRow({ isExpanded }) {
  return (
    <Grid.Row only="computer">
      <Grid.Column width={isExpanded ? 1 : 2}>{i18n.t('competitions.schedule.start')}</Grid.Column>
      <Grid.Column width={isExpanded ? 1 : 2}>{i18n.t('competitions.schedule.end')}</Grid.Column>
      <Grid.Column width={isExpanded ? 4 : 7}>{i18n.t('competitions.schedule.activity')}</Grid.Column>
      <Grid.Column width={isExpanded ? 3 : 5}>{i18n.t('competitions.schedule.room_or_stage')}</Grid.Column>
      {isExpanded && (
        <>
          <Grid.Column width={1}>{i18n.t('competitions.events.format')}</Grid.Column>
          <Grid.Column width={2}><a href="#time-limit">{i18n.t('competitions.events.time_limit')}</a></Grid.Column>
          <Grid.Column width={2}><a href="#cutoff">{i18n.t('competitions.events.cutoff')}</a></Grid.Column>
          <Grid.Column width={2}>{i18n.t('competitions.events.proceed')}</Grid.Column>
        </>
      )}
    </Grid.Row>
  );
}

function ActivityRow({
  isExpanded,
  activityGroup,
  round,
  rooms,
  timeZone,
  wcifEvents,
}) {
  const representativeActivity = activityGroup[0];
  const { startTime, endTime } = representativeActivity;

  const name = representativeActivity.activityCode.startsWith('other') ? representativeActivity.name : localizeActivityName(representativeActivity, wcifEvents);
  const eventId = representativeActivity.activityCode.startsWith('other') ? 'other' : parseActivityCode(representativeActivity.activityCode).eventId;

  const activityIds = activityGroup.map((activity) => activity.id);

  // note: round may be undefined for custom activities like lunch
  const {
    format, timeLimit, cutoff, advancementCondition,
  } = round || {};

  const roomsUsed = rooms.filter(
    (room) => room.activities.some((activity) => activityIds.includes(activity.id)),
  );

  return (
    <>
      <Grid.Row only="computer">
        <Grid.Column width={isExpanded ? 1 : 2}>
          {getSimpleTimeString(startTime, timeZone)}
        </Grid.Column>
        <Grid.Column width={isExpanded ? 1 : 2}>
          {getSimpleTimeString(endTime, timeZone)}
        </Grid.Column>
        <Grid.Column width={isExpanded ? 4 : 7}>
          {name}
        </Grid.Column>
        <Grid.Column width={isExpanded ? 3 : 5}>
          {roomsUsed.map((room) => room.name).join(', ')}
        </Grid.Column>
        {isExpanded && (
          <>
            <Grid.Column width={1}>
              {cutoff && format && `${formats.byId[cutoff.numberOfAttempts].shortName} / `}
              {format && formats.byId[format].shortName}
            </Grid.Column>
            <Grid.Column width={2}>
              {round && timeLimitToString(round, wcifEvents)}
              {timeLimit && (
                <>
                  {timeLimit.cumulativeRoundIds.length === 1 && (
                    <a href="#cumulative-time-limit">*</a>
                  )}
                  {timeLimit.cumulativeRoundIds.length > 1 && (
                    <a href="#cumulative-across-rounds-time-limit">**</a>
                  )}
                </>
              )}
            </Grid.Column>
            <Grid.Column width={2}>{cutoff && cutoffToString(round)}</Grid.Column>
            <Grid.Column width={2}>
              {advancementCondition && advancementConditionToString(round)}
            </Grid.Column>
          </>
        )}
      </Grid.Row>
      <Grid.Row only="tablet mobile">
        <Grid.Column textAlign="left" mobile={6} tablet={4}>
          {i18n.t('competitions.schedule.range.from')}
          <br />
          <b>{getSimpleTimeString(startTime, timeZone)}</b>
        </Grid.Column>
        <Grid.Column textAlign="center" mobile={4} tablet={8}>
          <Icon size="big" className={cn('cubing-icon', `event-${eventId}`)} />
        </Grid.Column>
        <Grid.Column textAlign="right" mobile={6} tablet={4}>
          {i18n.t('competitions.schedule.range.to')}
          <br />
          <b>{getSimpleTimeString(endTime, timeZone)}</b>
        </Grid.Column>
        <Grid.Column textAlign="center" mobile={16} tablet={10}>
          <b>{name}</b>
        </Grid.Column>
        <Grid.Column textAlign="center" mobile={16} tablet={6}>
          {roomsUsed.map((room) => room.name).join(', ')}
        </Grid.Column>
        {isExpanded && eventId !== 'other' && (
          <>
            {format && (
              <>
                <Grid.Column textAlign="left" mobile={6} tablet={4}>
                  {i18n.t('competitions.events.format')}
                </Grid.Column>
                <Grid.Column textAlign="right" mobile={10} tablet={4}>
                  <b>
                    {cutoff && `${formats.byId[cutoff.numberOfAttempts].shortName} / `}
                    {formats.byId[format].shortName}
                  </b>
                </Grid.Column>
              </>
            )}
            {timeLimit && (
              <>
                <Grid.Column textAlign="left" mobile={6} tablet={4}>
                  {i18n.t('competitions.events.time_limit')}
                </Grid.Column>
                <Grid.Column textAlign="right" mobile={10} tablet={4}>
                  <b>
                    {round && timeLimitToString(round, wcifEvents)}
                    {timeLimit.cumulativeRoundIds.length === 1 && (
                      <a href="#cumulative-time-limit">*</a>
                    )}
                    {timeLimit.cumulativeRoundIds.length > 1 && (
                      <a href="#cumulative-across-rounds-time-limit">**</a>
                    )}
                  </b>
                </Grid.Column>
              </>
            )}
            {cutoff && (
              <>
                <Grid.Column textAlign="left" mobile={6} tablet={4}>
                  {i18n.t('competitions.events.cutoff')}
                </Grid.Column>
                <Grid.Column textAlign="right" mobile={10} tablet={4}>
                  <b>{cutoffToString(round)}</b>
                </Grid.Column>
              </>
            )}
            {advancementCondition && (
              <>
                <Grid.Column textAlign="left" mobile={6} tablet={4}>
                  {i18n.t('competitions.events.proceed')}
                </Grid.Column>
                <Grid.Column textAlign="right" mobile={10} tablet={4}>
                  <b>{advancementConditionToString(round)}</b>
                </Grid.Column>
              </>
            )}
          </>
        )}
      </Grid.Row>
    </>
  );
}
