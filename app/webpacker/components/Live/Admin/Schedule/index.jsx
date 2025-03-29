import React from 'react';
import {
  Card, List, Segment,
} from 'semantic-ui-react';
import { events } from '../../../../lib/wca-data.js.erb';
import { liveUrls } from '../../../../lib/requests/routes.js.erb';

export default function AdminSchedulePage({ competitionId, rounds }) {
  const roundsById = _.groupBy(rounds, 'event.id');
  return (
    <Segment>
      <Card.Group>
        {_.map(roundsById, (r, key) => (
          <Card>
            <Card.Header>
              {events.byId[key].name}
            </Card.Header>
            <Card.Content>
              <List>
                {r.map((round) => (
                  <List.Item key={round.id}>
                    <a href={liveUrls.roundResultsAdmin(competitionId, round.id)}>{round.name}</a>
                    {' '}
                    (
                    {round.competitors_live_results_entered}
                    /
                    {round.total_accepted_registrations}
                    )
                  </List.Item>
                ))}
              </List>
            </Card.Content>
          </Card>
        ))}
      </Card.Group>
    </Segment>
  );
}
