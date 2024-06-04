import luxonPlugin from '@fullcalendar/luxon3';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { DateTime } from 'luxon';
import React from 'react';
import {
  earliestTimeOfDayWithBuffer,
  getActivityEventId,
  latestTimeOfDayWithBuffer,
  localizeActivityName,
} from '../../lib/utils/activities';
import { ACTIVITY_OTHER_GREY, getTextColor } from '../../lib/utils/calendar';
import I18n from '../../lib/i18n';

// We can render custom content for the individual fullcalendar events, by
// passing in a render function as the `eventContent` param to the `FullCalendar`
// component.
// This can be used to add a tooltip (to display round information, as the old
// calendar used to do), better indicate that an event continues after midnight,
// etc.
// However, then we have to recreate the default line-break and sizing logic of
// the name/time ourselves, which is annoying...
// Once https://github.com/fullcalendar/fullcalendar/issues/5927 is available,
// we can take the default content and just wrap a tooltip around it, which is
// exactly what we want.
// (Alternatively, implement the `eventClick` param to `FullCalendar` and have it
// open a modal. But that's a bit clunky so we're not doing it, for now at least.)

export default function CalendarView({
  dates,
  timeZone,
  activeVenues,
  activeRooms,
  activeEventIds,
  calendarLocale,
  wcifEvents,
}) {
  const fcActivities = activeRooms.flatMap((room) => room.activities
    .filter((activity) => ['other', ...activeEventIds].includes(getActivityEventId(activity)))
    .map((activity) => {
      const eventName = activity.activityCode.startsWith('other') ? activity.name : localizeActivityName(activity, wcifEvents);
      const eventColor = activity.activityCode.startsWith('other') ? ACTIVITY_OTHER_GREY : room.color;

      return ({
        title: eventName,
        start: activity.startTime,
        end: activity.endTime,
        backgroundColor: eventColor,
        textColor: getTextColor(eventColor),
      });
    }));

  // independent of which activities are visible,
  // to prevent calendar height jumping around
  const activeVenuesActivities = activeVenues.flatMap(
    (venue) => venue.rooms.flatMap((room) => room.activities),
  );
  const calendarStart = earliestTimeOfDayWithBuffer(activeVenuesActivities, timeZone) ?? '00:00:00';
  const calendarEnd = latestTimeOfDayWithBuffer(activeVenuesActivities, timeZone) ?? '00:00:00';

  return (
    <>
      <FullCalendar
        // plugins for the basic FullCalendar implementation.
        //   - timeGridPlugin: Display days as vertical grid
        //   - luxonPlugin: Support timezones
        plugins={[timeGridPlugin, luxonPlugin]}
        // define our "own" view
        initialView="agendaForComp"
        views={{
          agendaForComp: {
            type: 'timeGrid',
            // specify start/end rather than duration/initialDate, since
            // dates may change when changing time zone
            visibleRange: {
              start: dates[0].toJSDate(),
              end: dates[dates.length - 1].toJSDate(),
            },
          },
        }}
        // by default, FC offers support for separate "whole-day" events
        allDaySlot={false}
        // by default, FC would show a "skip to next day" toolbar
        headerToolbar={false}
        dayHeaderFormat={DateTime.DATE_HUGE}
        slotMinTime={calendarStart}
        slotMaxTime={calendarEnd}
        slotDuration="00:15:00"
        height="auto"
        locale={calendarLocale}
        timeZone={timeZone}
        events={fcActivities}
      />
      {fcActivities.length === 0 && (
        <em>{I18n.t('competitions.schedule.no_activities')}</em>
      )}
    </>
  );
}
