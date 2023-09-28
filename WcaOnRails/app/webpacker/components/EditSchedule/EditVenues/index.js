import React, { useMemo } from 'react';
import { Button, Container, Grid } from 'semantic-ui-react';
import _ from 'lodash';
import { useStore } from '../../../lib/providers/StoreProvider';
import VenuePanel from './VenuePanel';

function EditVenues({
  countryZones,
}) {
  const { wcifSchedule } = useStore();

  const displayVenues = useMemo(() => _.chunk(wcifSchedule.venues, 2), [wcifSchedule.venues]);

  return (
    <>
      <Container text>
        <p>Please add all your venues and rooms below:</p>
      </Container>

      <Container>
        <Grid>
          {displayVenues.map((venueRow, rowIdx) => (
            <Grid.Row key={rowIdx}>
              {venueRow.map((venue) => (
                <Grid.Column key={venue.id}>
                  <VenuePanel
                    venue={venue}
                    countryZones={countryZones}
                  />
                </Grid.Column>
              ))}
            </Grid.Row>
          ))}
          <Grid.Row stretched>
            <Grid.Column>
              <Button positive>Add a venue</Button>
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Container>
    </>
  );
}

export default EditVenues;
