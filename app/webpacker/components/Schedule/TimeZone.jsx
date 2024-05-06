import React, { useMemo } from 'react';
import { Dropdown } from 'semantic-ui-react';
import i18n from '../../lib/i18n';
import { timezoneData } from '../../lib/wca-data.js.erb';

const timeZoneOptions = Object.entries(timezoneData).map(([tzName, tzId]) => ({
  key: tzId,
  text: tzName,
  value: tzId,
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
        text: i18n.t('competitions.schedule.timezone.local'),
        value: 'local',
      },
      ...venues.map((venue, index) => ({
        key: venue.name,
        text: `${venue.name}'s`,
        value: index,
      })),
      {
        key: 'custom',
        text: i18n.t('competitions.schedule.timezone.custom'),
        value: 'custom',
      },
    ],
    [venues],
  );

  return (
    <div>
      {i18n.t('competitions.schedule.timezone_setting')}
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
      {activeTimeZoneLocation === 'custom' && (
        <p>
          {i18n.t('competitions.schedule.timezone_custom')}
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
        </p>
      ) }

    </div>
  );
}
