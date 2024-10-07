import React from 'react';
import {
  Button,
  Checkbox,
  Dropdown,
  Header,
  Segment,
} from 'semantic-ui-react';
import _ from 'lodash';
import i18n from '../../lib/i18n';
import { backendTimezones } from '../../lib/wca-data.js.erb';
import { sortByOffset } from '../../lib/utils/timezone';

// Timezones that our Ruby backend knows about. They represent values that might be stored
//   in the 'competition_venues' table.
const rubyTimeZones = Array.from(backendTimezones);
// Timezones that the user's browser knows about. The 'Set to local' button will use the
//   browser settings, so we need to make sure all possible values are included in the list.
const jsTimeZones = Intl.supportedValuesOf('timeZone');

const uniqueTimeZones = _.uniq(rubyTimeZones.concat(jsTimeZones));
const sortedTimeZones = sortByOffset(uniqueTimeZones, new Date());

const timeZoneOptions = sortedTimeZones.map((tz) => ({
  key: tz,
  text: tz,
  value: tz,
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
