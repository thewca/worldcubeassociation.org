import React, { useEffect } from 'react';
import {
  Button,
  Card,
  Container,
  Form,
  Icon,
} from 'semantic-ui-react';
import _ from 'lodash';

import VenueLocationMap from './VenueLocationMap';
import { countries, timezoneData } from '../../../lib/wca-data.js.erb';
import RoomPanel from './RoomPanel';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import { addRoom, editVenue, removeVenue } from '../store/actions';
import { toDegrees, toMicrodegrees } from '../../../lib/utils/edit-schedule';
import useInputState from '../../../lib/hooks/useInputState';

const countryOptions = countries.real.map((country) => ({
  key: country.iso2,
  text: country.name,
  value: country.iso2,
}));

function VenuePanel({
  venue,
  countryZones,
}) {
  const dispatch = useDispatch();

  const [latitudeDegrees, setLatitudeDegrees] = useInputState(
    toDegrees(venue.latitudeMicrodegrees),
  );

  const [longitudeDegrees, setLongitudeDegrees] = useInputState(
    toDegrees(venue.longitudeMicrodegrees),
  );

  useEffect(() => {
    const latitudeMicrodegrees = toMicrodegrees(latitudeDegrees);
    dispatch(editVenue(venue.id, 'latitudeMicrodegrees', latitudeMicrodegrees));
  }, [dispatch, venue.id, latitudeDegrees]);

  useEffect(() => {
    const longitudeMicrodegrees = toMicrodegrees(longitudeDegrees);
    dispatch(editVenue(venue.id, 'longitudeMicrodegrees', longitudeMicrodegrees));
  }, [dispatch, venue.id, longitudeDegrees]);

  const handleVenueChange = (evt, { name, value }) => {
    dispatch(editVenue(venue.id, name, value));
  };

  const handleDeleteVenue = () => {
    if (confirm(`Are you sure you want to delete the venue ${venue.name}? This will also delete all associated rooms and all associated schedules. THIS ACTION CANNOT BE UNDONE!`)) {
      dispatch(removeVenue(venue.id));
    }
  };

  const handleAddRoom = () => {
    dispatch(addRoom(venue.id));
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

  const timezoneOptions = selectKeys.map((key) => ({
    key,
    text: key,
    value: timezoneData[key] || key,
  }));

  return (
    <Card fluid raised>
      { /* Needs the className 'image' so that SemUI fills the top of the card */ }
      <Container className="image venue-map" style={{ height: '300px' }}>
        <VenueLocationMap
          venue={venue}
        />
      </Container>
      <Card.Content>
        <Form>
          <Form.Group widths="equal">
            <Form.Input
              label="Latitude"
              name="latitudeMicrodegrees"
              value={toDegrees(venue.latitudeMicrodegrees)}
              onChange={setLatitudeDegrees}
            />
            <Form.Input
              label="Longitude"
              name="longitudeMicrodegrees"
              value={toDegrees(venue.longitudeMicrodegrees)}
              onChange={setLongitudeDegrees}
            />
          </Form.Group>
          <Form.Input
            label="Name"
            name="name"
            value={venue.name}
            onChange={handleVenueChange}
          />
          <Form.Select
            label="Country"
            name="countryIso2"
            options={countryOptions}
            value={venue.countryIso2}
            onChange={handleVenueChange}
          />
          <Form.Select
            label="Timezone"
            name="timezone"
            options={timezoneOptions}
            value={venue.timezone}
            onChange={handleVenueChange}
          />
        </Form>
      </Card.Content>
      <Card.Content>
        <Card.Header>Rooms</Card.Header>
        <Card.Description>
          <Card.Group itemsPerRow={2}>
            {venue.rooms.map((room) => (
              <RoomPanel
                key={room.id}
                room={room}
              />
            ))}
          </Card.Group>
          <Button positive onClick={handleAddRoom}>Add room</Button>
        </Card.Description>
      </Card.Content>
      <Card.Content>
        <Button negative icon onClick={handleDeleteVenue}>
          <Icon name="trash" />
        </Button>
      </Card.Content>
    </Card>
  );
}

export default VenuePanel;
