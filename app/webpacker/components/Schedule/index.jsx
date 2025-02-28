import React, { useState } from 'react';
import { Message, Segment } from 'semantic-ui-react';
import CalendarView from './CalendarView';
import TableView from './TableView';
import TimeZoneSelector from './TimeZone';
import VenuesAndRooms from './VenuesAndRooms';
import ViewSelector from './ViewSelector';
import useStoredState from '../../lib/hooks/useStoredState';
import useSet from '../../lib/hooks/useSet';
import { earliestWithLongestTieBreaker } from '../../lib/utils/activities';
import { getDatesBetweenInclusive } from '../../lib/utils/dates';
import EventSelector from '../wca/EventSelector';
import I18n from '../../lib/i18n';

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
  const activeRoomIds = useSet(roomsOfActiveVenues.map((room) => room.id));
  const activeRooms = roomsOfActiveVenues.filter((room) => activeRoomIds.asSet.has(room.id));

  // events

  const availableEventIds = wcifEvents.map(({ id }) => id);
  const activeEventIds = useSet(availableEventIds);
  const activeEvents = wcifEvents.filter(({ id }) => activeEventIds.has(id));

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
            {I18n.t('competitions.schedule.multiple_timezones_available')}
          </Message.Content>
        </Message>
      )}

      <Message>
        <Message.Content>
          {I18n.t('competitions.schedule.schedule_change_warning')}
        </Message.Content>
      </Message>

      <VenuesAndRooms
        venues={venues}
        activeVenueOrNull={activeVenueOrNull}
        activeVenueIndex={activeVenueIndex}
        setActiveVenueIndex={setActiveVenueIndexAndUpdateTimeZone}
        timeZoneCount={timeZoneCount}
        rooms={roomsOfActiveVenues}
        activeRoomIds={activeRoomIds.asArray}
        updateRooms={activeRoomIds.update}
        toggleRoom={activeRoomIds.toggle}
        setActiveTimeZone={setActiveTimeZone}
      />

      <Segment>
        <EventSelector
          eventList={availableEventIds}
          selectedEvents={activeEventIds.asArray}
          onEventClick={activeEventIds.toggle}
          onAllClick={() => activeEventIds.update(availableEventIds)}
          onClearClick={activeEventIds.clear}
        />
      </Segment>

      <TimeZoneSelector
        activeVenueOrNull={activeVenueOrNull}
        hasMultipleVenues={venueCount > 1}
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
          activeEventIds={activeEventIds.asArray}
          calendarLocale={calendarLocale}
          wcifEvents={wcifEvents}
        />
      ) : (
        <TableView
          dates={activeDates}
          timeZone={activeTimeZone}
          activeRooms={activeRooms}
          activeEvents={activeEvents}
          activeVenueOrNull={activeVenueOrNull}
          competitionName={competitionName}
          wcifEvents={wcifEvents}
        />
      )}
    </>
  );
}
