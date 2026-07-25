import { DateTime } from 'luxon';
import React from 'react';
import { List } from 'semantic-ui-react';

export default function AddToCalendar({
  startDate,
  endDate,
  timeZone,
  name,
  address,
  allDay,
}) {
  // note: date corresponds to midnight for all-day events, so need to use the day after
  const endDateOffset = allDay ? { days: 1 } : {};
  const format = allDay ? 'yyyyMMdd' : "yyyyMMdd'T'HHmmssZ";

  const formattedStartDate = DateTime.fromISO(startDate, { zone: timeZone }).toFormat(format);
  const formattedEndDate = DateTime.fromISO(endDate, { zone: timeZone })
    .plus(endDateOffset)
    .toFormat(format);

  const googleCalendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${name}&dates=${formattedStartDate}/${formattedEndDate}${
    address ? `&location=${address}` : ''
  }`;

  return (
    <a href={googleCalendarLink} target="_blank" rel="noreferrer" className="hide-new-window-icon">
      <List.Icon name="calendar plus" link />
    </a>
  );
}
