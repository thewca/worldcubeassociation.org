"use client";

import React, { useState } from "react";
import CalendarView from "./CalendarView";
import TableView from "./TableView";
import TimeZoneSelector from "./TimeZoneSelector";
import VenuesAndRooms from "./VenuesAndRooms";
import ViewSelector from "./ViewSelector";
import {
  earliestWithLongestTieBreaker,
  type WcifSchedule,
} from "@/lib/wca/wcif/activities";
import type { WcifEvent } from "@/lib/wca/wcif/rounds";
import useSet from "@/lib/hooks/useSet";
import useStoredState from "@/lib/hooks/useStoredState";
import { getDatesBetweenInclusive } from "@/lib/wca/dates";
import { Alert, Box, VStack } from "@chakra-ui/react";
import { useT } from "@/lib/i18n/useI18n";
import EventSelector from "@/components/EventSelector";

interface ScheduleProps {
  wcifSchedule: WcifSchedule;
  wcifEvents: WcifEvent[];
  competitionName: string;
}

export default function Schedule({
  wcifSchedule,
  wcifEvents,
  competitionName,
}: ScheduleProps) {
  // venues

  const { venues } = wcifSchedule;
  const mainVenueIndex = 0;
  const venueCount = venues.length;
  const [activeVenueIndex, setActiveVenueIndex] = useState(-1);

  const activeVenueOrNull =
    venueCount === 1
      ? venues[0]
      : activeVenueIndex !== -1
        ? venues[activeVenueIndex]
        : undefined;
  const activeVenues = activeVenueOrNull ? [activeVenueOrNull] : venues;

  // time zones

  const [followVenueSelection, setFollowVenueSelection] = useState(true);
  const [activeTimeZone, setActiveTimeZone] = useState(
    venues[mainVenueIndex].timezone,
  );

  const uniqueTimeZones = [...new Set(venues.map((venue) => venue.timezone))];
  const timeZoneCount = uniqueTimeZones.length;

  const setActiveVenueIndexAndUpdateTimeZone = (newIndex: number) => {
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
  const activeRooms = roomsOfActiveVenues.filter((room) =>
    activeRoomIds.asSet.has(room.id),
  );

  // events

  const availableEventIds = wcifEvents.map(({ id }) => id);
  const activeEventIds = useSet(availableEventIds);

  // view

  const [activeView, setActiveView] = useStoredState(
    "calendar",
    "scheduleView",
  );

  const allActivitiesSorted = venues
    .flatMap((venue) => venue.rooms)
    .flatMap((room) => room.activities)
    .toSorted(earliestWithLongestTieBreaker);

  // use this, rather than wcif's startDate, in-case viewing in different time zone
  const firstStartTime = allActivitiesSorted[0].startTime;
  const lastStartTime =
    allActivitiesSorted[allActivitiesSorted.length - 1].startTime;

  const activeDates = getDatesBetweenInclusive(
    firstStartTime,
    lastStartTime,
    activeTimeZone,
  );

  const { t } = useT();

  return (
    <VStack gap="3" alignItems="stretch">
      {timeZoneCount > 1 && (
        <Alert.Root status="warning">
          <Alert.Content>
            <Alert.Title>
              {t("competitions.schedule.multiple_timezones_available")}
            </Alert.Title>
          </Alert.Content>
        </Alert.Root>
      )}

      <Alert.Root status="info" colorPalette="gray">
        <Alert.Content>
          <Alert.Title>
            {t("competitions.schedule.schedule_change_warning")}
          </Alert.Title>
        </Alert.Content>
      </Alert.Root>

      <VenuesAndRooms
        wcifVenues={venues}
        activeVenue={activeVenueOrNull}
        activeVenueIndex={activeVenueIndex}
        setActiveVenueIndex={setActiveVenueIndexAndUpdateTimeZone}
        rooms={roomsOfActiveVenues}
        activeRoomIds={activeRoomIds.asArray}
        updateRooms={activeRoomIds.update}
        toggleRoom={activeRoomIds.toggle}
        clearRooms={activeRoomIds.clear}
        setActiveTimeZone={setActiveTimeZone}
      />

      <Box border="sm" borderRadius="l3" padding="4">
        <EventSelector
          title={t("competitions.competition_form.events")}
          eventList={availableEventIds}
          selectedEvents={activeEventIds.asArray}
          onEventClick={activeEventIds.toggle}
          onAllClick={() => activeEventIds.update(availableEventIds)}
          onClearClick={activeEventIds.clear}
          showBreakBeforeButtons={false}
        />
      </Box>

      <Box border="sm" borderRadius="l3" padding="4">
        <TimeZoneSelector
          activeVenue={activeVenueOrNull}
          hasMultipleVenues={venueCount > 1}
          activeTimeZone={activeTimeZone}
          setActiveTimeZone={setActiveTimeZone}
          followVenueSelection={followVenueSelection}
          setFollowVenueSelection={setFollowVenueSelection}
        />
      </Box>

      <ViewSelector activeView={activeView} setActiveView={setActiveView} />

      {activeView === "calendar" ? (
        <CalendarView
          dates={activeDates}
          timeZone={activeTimeZone}
          activeVenues={activeVenues}
          activeRooms={activeRooms}
          activeEventIds={activeEventIds.asArray}
          wcifEvents={wcifEvents}
        />
      ) : (
        <TableView
          dates={activeDates}
          timeZone={activeTimeZone}
          activeRooms={activeRooms}
          activeEventIds={activeEventIds.asArray}
          activeVenue={activeVenueOrNull}
          competitionName={competitionName}
          wcifEvents={wcifEvents}
        />
      )}
    </VStack>
  );
}
