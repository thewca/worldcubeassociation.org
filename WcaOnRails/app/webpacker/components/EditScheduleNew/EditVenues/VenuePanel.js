import React from 'react';
import {
  Button,
  Card, Container,
  Form, Icon,
  Image,
} from 'semantic-ui-react';
import _ from 'lodash';

import VenueLocationMap from './VenueLocationMap';
import { countries, timezoneData } from '../../../lib/wca-data.js.erb';
import RoomPanel from './RoomPanel';

const countryOptions = countries.real.map((country) => {
  return {
    key: country.iso2,
    text: country.name,
    value: country.iso2,
  };
});

function VenuePanel({
  venue,
  countryZones,
}) {
  const handleChange = (evt, { name, value }) => {
    // TODO fire dispatch events!
    console.log(evt, name, value);
  };

  // Instead of giving *all* TZInfo, use uniq-fied rails "meaningful" subset
  // We'll add the "country_zones" to that, because some of our competitions
  // use TZs not included in this subset.
  // We want to display the "country_zones" first, so that it's more convenient for the user.
  // In the end the array should look like that:
  //   - country_zone_a, country_zone_b, [...], other_tz_a, other_tz_b, [...]
  const competitionZonesKeys = Object.keys(countryZones);
  let selectKeys = _.difference(Object.keys(timezoneData), competitionZonesKeys);
  selectKeys = _.union(competitionZonesKeys.sort(), selectKeys.sort());

  const timezoneOptions = selectKeys.map((key) => {
    return {
      key,
      text: key,
      value: timezoneData[key] || key,
    };
  });

  return (
    <Card fluid raised>
      <Container className="image venue-map" style={{ height: '300px' }}>
        <VenueLocationMap
          venue={venue}
        />
      </Container>
      <Card.Content>
        <Form>
          <Form.Input
            label="Name"
            name="name"
            value={venue.name}
          />
          <Form.Select
            label="Country"
            name="country"
            options={countryOptions}
            value={venue.countryIso2}
          />
          <Form.Select
            label="Timezone"
            name="tz"
            options={timezoneOptions}
            value={venue.timezone}
          />
        </Form>
      </Card.Content>
      <Card.Content>
        <Card.Group>
          {venue.rooms.map((room) => (
            <RoomPanel
              key={room.id}
              room={room}
            />
          ))}
        </Card.Group>
        <div className="ui two buttons">
          <Button positive>Add room</Button>
        </div>
      </Card.Content>
      <Card.Content>
        <Button negative icon>
          <Icon name="trash" />
        </Button>
      </Card.Content>
    </Card>
  );
}

export default VenuePanel;
