import { getFormatName } from '@wca/helpers';
import { DateTime } from 'luxon';
import React, { useContext, useState } from 'react';
import {
  Checkbox, Header, Segment, Table, TableCell,
} from 'semantic-ui-react';
import {
  activitiesOnDate,
  earliestWithLongestTieBreaker,
  getActivityEvent,
  getActivityRoundId,
  groupActivities,
} from '../../lib/utils/activities';
import { getSimpleTimeString } from '../../lib/utils/dates';
import { toDegrees } from '../../lib/utils/venues';
import AddToCalendar from './AddToCalendar';

export default function TableView({
  dates,
  timeZone,
  activeRooms,
  activeEvents,
  activeVenueOrNull,
  competitionName,
}) {
  const rounds = activeEvents.flatMap((event) => event.rounds);

  const [isExpanded, setIsExpanded] = useState(false);

  const sortedActivities = activeRooms
    .flatMap((room) => room.activities)
    .toSorted(earliestWithLongestTieBreaker);

  const eventIds = activeEvents.map(({ id }) => id);
  const visibleActivities = sortedActivities.filter((activity) => ['other', ...eventIds].includes(getActivityEvent(activity)));

  return (
    <>
      <Checkbox
        name="details"
        label="Show Round Details"
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
            rounds={rounds}
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
  rounds,
  rooms,
  isExpanded,
  activeVenueOrNull,
  competitionName,
}) {
  const title = `Schedule for ${date.toLocaleString(DateTime.DATE_HUGE)}`;

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
                  round={activityRound}
                  rooms={rooms}
                  timeZone={timeZone}
                />
              );
            })
          ) : (
            <Table.Row>
              <Table.Cell colSpan={4}>
                <em>No activities for the selected rooms/events.</em>
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
      <Table.HeaderCell>Start</Table.HeaderCell>
      <Table.HeaderCell>End</Table.HeaderCell>
      <Table.HeaderCell>Activity</Table.HeaderCell>
      <Table.HeaderCell>Room(s) or Stage(s)</Table.HeaderCell>
      {isExpanded && (
        <>
          <Table.HeaderCell>Format</Table.HeaderCell>
          <Table.HeaderCell>Time Limit</Table.HeaderCell>
          <Table.HeaderCell>Cutoff</Table.HeaderCell>
          <Table.HeaderCell>Proceed</Table.HeaderCell>
        </>
      )}
    </Table.Row>
  );
}

function ActivityRow({
  isExpanded, activityGroup, round, rooms, timeZone,
}) {
  const { name, startTime, endTime } = activityGroup[0];
  const activityIds = activityGroup.map((activity) => activity.id);
  // note: round may be undefined for custom activities like lunch
  const {
    format, timeLimit, cutoff, advancementCondition,
  } = round || {};
  const roomsUsed = rooms.filter(
    (room) => room.activities.some((activity) => activityIds.includes(activity.id)),
  );

  // TODO: create name from activity code when possible (fallback to name property)
  // TODO: time limit not showing up for fm & multi
  // TODO: display times in appropriate format

  return (
    <Table.Row>
      <Table.Cell>{getSimpleTimeString(startTime, timeZone)}</Table.Cell>

      <Table.Cell>{getSimpleTimeString(endTime, timeZone)}</Table.Cell>

      <Table.Cell>{name}</Table.Cell>

      <Table.Cell>{roomsUsed.map((room) => room.name).join(', ')}</Table.Cell>

      {isExpanded && (
        <>
          <Table.Cell>{format && getFormatName(format)}</Table.Cell>

          <TableCell>
            {timeLimit && `${timeLimit.centiseconds / 100} seconds`}
          </TableCell>

          <TableCell>
            {cutoff && `${cutoff.attemptResult / 100} seconds`}
          </TableCell>

          <TableCell>
            {advancementCondition
              && `Top ${advancementCondition.level} ${advancementCondition.type} proceed`}
          </TableCell>
        </>
      )}
    </Table.Row>
  );
}
