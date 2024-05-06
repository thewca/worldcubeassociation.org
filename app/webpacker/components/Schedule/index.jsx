import React, { useReducer, useState } from 'react';
import { Message, Segment } from 'semantic-ui-react';
import CalendarView from './CalendarView';
import TableView from './TableView';
import TimeZoneSelector from './TimeZone';
import VenuesAndRooms from './VenuesAndRooms';
import ViewSelector from './ViewSelector';
import useStoredState from '../../lib/hooks/useStoredState';
import { earliestWithLongestTieBreaker } from '../../lib/utils/activities';
import { getDatesBetweenInclusive } from '../../lib/utils/dates';
import { EventSelector } from '../CompetitionsOverview/CompetitionsFilters';
import i18n from '../../lib/i18n';

const activeIdReducer = (state, { type, id, ids }) => {
  let newState = [...state];

  switch (type) {
    case 'toggle':
      if (newState.includes(id)) {
        newState = newState.filter((x) => x !== id);
      } else {
        newState.push(id);
      }
      return newState;

    case 'reset':
      return ids ?? [];

    default:
      throw new Error('Unknown action.');
  }
};

export default function Schedule({
  wcifSchedule,
  wcifEvents,
  competitionName,
  calendarLocale,
}) {
  // venues

  const { venues } = wcifSchedule;
  const mainVenueIndex = 0;
  const venueCount = venues.length;
  const [activeVenueIndex, setActiveVenueIndex] = useState(-1);
  // eslint-disable-next-line no-nested-ternary
  const activeVenueOrNull = venueCount === 1
    ? venues[0]
    : activeVenueIndex !== -1
      ? venues[activeVenueIndex]
      : null;
  const activeVenues = activeVenueOrNull ? [activeVenueOrNull] : venues;

  // time zones

  const [followVenueSelection, setFollowVenueSelection] = useState(true);
  const [activeTimeZone, setActiveTimeZone] = useState(venues[mainVenueIndex].timezone);

  const uniqueTimeZones = [...new Set(venues.map((venue) => venue.timezone))];
  const timeZoneCount = uniqueTimeZones.length;

  const setActiveVenueIndexAndUpdateTimeZone = (newIndex) => {
    // First tab represents "all" and has index -1
    if (newIndex >= 0 && followVenueSelection) {
      const venueTimeZone = venues[newIndex].timezone;
      setActiveTimeZone(venueTimeZone);
    }

    setActiveVenueIndex(newIndex);
  };

  // rooms

  const roomsOfActiveVenues = activeVenues.flatMap((venue) => venue.rooms);
  const [activeRoomIds, dispatchRooms] = useReducer(
    activeIdReducer,
    roomsOfActiveVenues.map((room) => room.id),
  );
  const activeRooms = roomsOfActiveVenues.filter((room) => activeRoomIds.includes(room.id));

  // events

  const [activeEventIds, dispatchEvents] = useReducer(
    activeIdReducer,
    wcifEvents.map((event) => event.id),
  );
  const availableEventIds = wcifEvents.map(({ id }) => id);
  const activeEvents = wcifEvents.filter(({ id }) => activeEventIds.includes(id));

  const handleEventSelection = ({ type, eventId }) => {
    if (type === 'select_all_events') {
      dispatchEvents({ type: 'reset', ids: availableEventIds });
    } else if (type === 'clear_events') {
      dispatchEvents({ type: 'reset' });
    } else if (type === 'toggle_event') {
      dispatchEvents({ type: 'toggle', id: eventId });
    }
  };

  // view

  const [activeView, setActiveView] = useStoredState('calendar', 'scheduleView');

  const allActivitiesSorted = venues
    .flatMap((venue) => venue.rooms)
    .flatMap((room) => room.activities)
    .toSorted(earliestWithLongestTieBreaker);
  // use this, rather than wcif's startDate, in-case viewing in different time zone
  const firstStartTime = allActivitiesSorted[0].startTime;
  const lastStartTime = allActivitiesSorted[allActivitiesSorted.length - 1].startTime;
  const activeDates = getDatesBetweenInclusive(
    firstStartTime,
    lastStartTime,
    activeTimeZone,
  );

  return (
    <>
      {timeZoneCount > 1 && (
        <Message warning>
          <Message.Content>
            {i18n.t('competitions.schedule.multiple_timezones_available')}
          </Message.Content>
        </Message>
      )}

      <Message>
        <Message.Content>
          {i18n.t('competitions.schedule.schedule_change_warning')}
        </Message.Content>
      </Message>

      <VenuesAndRooms
        venues={venues}
        activeVenueOrNull={activeVenueOrNull}
        activeVenueIndex={activeVenueIndex}
        setActiveVenueIndex={setActiveVenueIndexAndUpdateTimeZone}
        timeZoneCount={timeZoneCount}
        rooms={roomsOfActiveVenues}
        activeRoomIds={activeRoomIds}
        dispatchRooms={dispatchRooms}
        setActiveTimeZone={setActiveTimeZone}
      />

      <Segment>
        <EventSelector
          eventList={availableEventIds}
          selectedEvents={activeEventIds}
          onEventSelection={handleEventSelection}
        />
      </Segment>

      <TimeZoneSelector
        activeVenueOrNull={activeVenueOrNull}
        activeTimeZone={activeTimeZone}
        setActiveTimeZone={setActiveTimeZone}
        followVenueSelection={followVenueSelection}
        setFollowVenueSelection={setFollowVenueSelection}
      />

      <ViewSelector activeView={activeView} setActiveView={setActiveView} />

      {activeView === 'calendar' ? (
        <CalendarView
          dates={activeDates}
          timeZone={activeTimeZone}
          activeVenues={activeVenues}
          activeRooms={activeRooms}
          activeEvents={activeEvents}
          calendarLocale={calendarLocale}
        />
      ) : (
        <TableView
          dates={activeDates}
          timeZone={activeTimeZone}
          activeRooms={activeRooms}
          activeEvents={activeEvents}
          activeVenueOrNull={activeVenueOrNull}
          competitionName={competitionName}
        />
      )}
    </>
  );
}
