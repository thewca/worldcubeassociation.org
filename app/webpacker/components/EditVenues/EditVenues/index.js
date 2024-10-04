import React from 'react';
import {
  Button,
  Card,
  Container,
  Icon,
  Segment,
} from 'semantic-ui-react';
import { useDispatch, useStore } from '../../../lib/providers/StoreProvider';
import VenuePanel from './VenuePanel';
import { addVenue } from '../store/actions';

function EditVenues({
  countryZones,
  referenceTime,
}) {
  const { wcifSchedule } = useStore();

  const dispatch = useDispatch();

  const handleAddVenue = () => {
    dispatch(addVenue());
  };

  return (
    <div id="venues-edit-panel-body">
      <Container text>
        <Button floated="right" compact icon labelPosition="left" positive onClick={handleAddVenue}>
          <Icon name="add" />
          Add a venue
        </Button>
        <h3>Venues</h3>
      </Container>

      <Segment basic>
        <Card.Group centered itemsPerRow={2}>
          {wcifSchedule.venues.map((venue) => (
            <VenuePanel
              key={venue.id}
              venue={venue}
              countryZones={countryZones}
              referenceTime={referenceTime}
            />
          ))}
        </Card.Group>
      </Segment>
    </div>
  );
}

export default EditVenues;
