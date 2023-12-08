import React from 'react';
import {
  Button,
  Card,
  Container,
  Icon,
  Segment
} from 'semantic-ui-react';
import { useDispatch, useStore } from '../../../lib/providers/StoreProvider';
import VenuePanel from './VenuePanel';
import { addVenue } from '../store/actions';

function EditVenues({
  countryZones,
}) {
  const { wcifSchedule } = useStore();

  const dispatch = useDispatch();

  const handleAddVenue = () => {
    dispatch(addVenue());
  };

  return (
    <>
      <Container text>
        <Button floated="right" compact icon labelPosition="left" positive onClick={handleAddVenue}>
          <Icon name="add" />
          Add room
        </Button>
        Please add all your venues and rooms below:
      </Container>

      <Segment basic>
        <Card.Group centered itemsPerRow={2}>
          {wcifSchedule.venues.map((venue) => (
            <VenuePanel
              key={venue.id}
              venue={venue}
              countryZones={countryZones}
            />
          ))}
        </Card.Group>
      </Segment>
    </>
  );
}

export default EditVenues;
