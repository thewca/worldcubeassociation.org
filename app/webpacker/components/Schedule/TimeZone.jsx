import React from 'react';
import {
  Button,
  Checkbox,
  Dropdown,
  Header,
  Segment,
} from 'semantic-ui-react';
import i18n from '../../lib/i18n';
import { timezoneData } from '../../lib/wca-data.js.erb';

const timeZoneOptions = Object.entries(timezoneData).map(([tzName, tzId]) => ({
  key: tzId,
  text: tzName,
  value: tzId,
}));

const { timeZone: userTimeZone } = Intl.DateTimeFormat().resolvedOptions();

export default function TimeZoneSelector({
  activeVenueOrNull,
  hasMultipleVenues,
  activeTimeZone,
  setActiveTimeZone,
  followVenueSelection,
  setFollowVenueSelection,
}) {
  return (
    <Segment>
      <Header size="small">{i18n.t('competitions.schedule.time_zone')}</Header>
      {i18n.t('competitions.schedule.timezone_setting')}
      {' '}
      <Dropdown
        search
        selection
        value={activeTimeZone}
        onChange={(_, data) => setActiveTimeZone(data.value)}
        options={timeZoneOptions}
      />
      <br />
      <Button
        compact
        icon="home"
        content={i18n.t('competitions.schedule.timezone_set_local')}
        labelPosition="left"
        onClick={() => setActiveTimeZone(userTimeZone)}
      />
      {activeVenueOrNull && (
        <Button
          compact
          icon="map pin"
          content={i18n.t('competitions.schedule.timezone_set_venue')}
          labelPosition="left"
          onClick={() => setActiveTimeZone(activeVenueOrNull.timezone)}
        />
      )}
      {' '}
      {hasMultipleVenues && (
        <Checkbox
          label={i18n.t('competitions.schedule.timezone_follow_venue')}
          checked={followVenueSelection}
          onChange={(_, data) => setFollowVenueSelection(data.checked)}
        />
      )}
    </Segment>
  );
}
