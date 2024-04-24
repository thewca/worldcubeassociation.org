import React, { useMemo } from 'react';
import { Dropdown } from 'semantic-ui-react';

const timeZoneOptions = Intl.supportedValuesOf('timeZone').map((timeZone) => ({
  key: timeZone,
  text: timeZone,
  value: timeZone,
}));

export default function TimeZoneSelector({
  venues,
  activeTimeZone,
  activeTimeZoneLocation,
  dispatchTimeZone,
}) {
  const locationOptions = useMemo(
    () => [
      {
        key: 'local',
        text: 'your local',
        value: 'local',
      },
      ...venues.map((venue, index) => ({
        key: venue.name,
        text: `${venue.name}'s`,
        value: index,
      })),
      {
        key: 'custom',
        text: 'a custom',
        value: 'custom',
      },
    ],
    [venues],
  );

  return (
    <div>
      The schedule is currently displayed in
      {' '}
      <Dropdown
        search
        selection
        value={activeTimeZoneLocation}
        onChange={(_, data) => dispatchTimeZone({
          type: 'update-location',
          location: data.value,
          venues,
        })}
        options={locationOptions}
      />
      {' '}
      time zone:
      {' '}
      <Dropdown
        search
        selection
        value={activeTimeZone}
        onChange={(_, data) => dispatchTimeZone({
          type: 'update-time-zone',
          timeZone: data.value,
          venues,
        })}
        options={timeZoneOptions}
      />
      .
    </div>
  );
}
