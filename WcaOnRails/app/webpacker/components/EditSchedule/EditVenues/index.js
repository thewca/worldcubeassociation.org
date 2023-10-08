import React from 'react';
import { Button, Card, Container } from 'semantic-ui-react';
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
        <p>Please add all your venues and rooms below:</p>
      </Container>

      <Container>
        <Card.Group centered itemsPerRow={2}>
          {wcifSchedule.venues.map((venue) => (
            <VenuePanel
              key={venue.id}
              venue={venue}
              countryZones={countryZones}
            />
          ))}
        </Card.Group>
        <Button positive onClick={handleAddVenue}>Add a venue</Button>
      </Container>
    </>
  );
}

export default EditVenues;
