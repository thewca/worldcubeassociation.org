import React, { useMemo } from 'react';
import {
  Button,
  Card,
  Container,
  Form,
  Icon,
  Image,
} from 'semantic-ui-react';
import _ from 'lodash';

import VenueLocationMap from './VenueLocationMap';
import { countries, timezoneData } from '../../../lib/wca-data.js.erb';
import RoomPanel from './RoomPanel';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import { useConfirm } from '../../../lib/providers/ConfirmProvider';
import { addRoom, editVenue, removeVenue, reorderRoom } from '../store/actions';
import { toDegrees, toMicrodegrees } from '../../../lib/utils/edit-schedule';

const countryOptions = countries.real.map((country) => ({
  key: country.iso2,
  text: country.name,
  value: country.iso2,
  flag: country.iso2.toLowerCase(),
}));

function VenuePanel({
  venue,
  countryZones,
}) {
  const dispatch = useDispatch();
  const confirm = useConfirm();

  const handleCoordinateChange = (evt, { name, value }) => {
    dispatch(editVenue(venue.id, name, toMicrodegrees(value)));
  };

  const handleVenueChange = (evt, { name, value }) => {
    dispatch(editVenue(venue.id, name, value));
  };

  const handleDeleteVenue = () => {
    confirm({
      content: `Are you sure you want to delete the venue ${venue.name}? This will also delete all associated rooms and all associated schedules. THIS ACTION CANNOT BE UNDONE!`,
    }).then(() => dispatch(removeVenue(venue.id)));
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
  const timezoneOptions = useMemo(() => {
    const competitionZonesKeys = Object.keys(countryZones);

    const selectKeys = _.difference(Object.keys(timezoneData), competitionZonesKeys);
    const sortedKeys = _.union(competitionZonesKeys.sort(), selectKeys.sort());

    return sortedKeys.map((key) => ({
      key,
      text: key,
      value: timezoneData[key] || key,
    }));
  }, [countryZones]);

  return (
    <Card fluid raised>
      { /* Needs the className 'image' so that SemUI fills the top of the card */ }
      <Container as={Image} className="venue-map" style={{ height: '300px' }}>
        <VenueLocationMap
          venue={venue}
        />
      </Container>
      <Card.Content>
        <Card.Header>
          <Button floated="right" compact icon labelPosition="left" negative onClick={handleDeleteVenue}>
            <Icon name="trash" />
            Remove
          </Button>
        </Card.Header>
        <Card.Description>
          <Form>
            <Form.Group widths="equal">
              <Form.Input
                label="Latitude"
                name="latitudeMicrodegrees"
                value={toDegrees(venue.latitudeMicrodegrees)}
                onChange={handleCoordinateChange}
              />
              <Form.Input
                label="Longitude"
                name="longitudeMicrodegrees"
                value={toDegrees(venue.longitudeMicrodegrees)}
                onChange={handleCoordinateChange}
              />
            </Form.Group>
            <Form.Input
              id="venue-name"
              label="Name"
              name="name"
              value={venue.name}
              onChange={handleVenueChange}
            />
            <Form.Select
              search
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
        </Card.Description>
      </Card.Content>
      <Card.Content>
        <Card.Header>
          <Button floated="right" compact icon labelPosition="left" positive onClick={handleAddRoom}>
            <Icon name="add" />
            Add room
          </Button>
          Rooms
        </Card.Header>
        <Card.Description>
          <Card.Group itemsPerRow={2}>
            {venue.rooms.map((room, index) => (
              <RoomPanel
                key={room.id}
                room={room}
                sendToFront={index > 0 ? () => dispatch(reorderRoom(venue.id, index, 0)) : undefined}
              />
            ))}
          </Card.Group>
        </Card.Description>
      </Card.Content>
    </Card>
  );
}

export default VenuePanel;
