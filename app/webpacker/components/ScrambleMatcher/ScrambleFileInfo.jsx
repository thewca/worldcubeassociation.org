import React, { useState } from 'react';
import {
  Accordion, Card, CardContent, CardDescription, CardHeader, Header, Icon, List, ListItem,
} from 'semantic-ui-react';
import { events, roundTypes } from '../../lib/wca-data.js.erb';

export default function ScrambleFileInfo({ uploadedJSON }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card fluid>
      <Accordion open={expanded} styled fluid>
        <Accordion.Title onClick={() => setExpanded(!expanded)}>
          <CardHeader>
            <Header>
              <Icon name="dropdown" />
              {uploadedJSON.competition_id}
            </Header>
          </CardHeader>
          <CardDescription>
            Generated with
            {' '}
            {uploadedJSON.scramble_program}
            <br />
            On
            {' '}
            {uploadedJSON.generated_at}
          </CardDescription>
        </Accordion.Title>
        <Accordion.Content active={expanded}>
          <CardContent style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <List>
              {uploadedJSON.inbox_scramble_sets.map((scrambleSet) => (
                <ListItem key={scrambleSet.id}>
                  {events.byId[scrambleSet.event_id].name}
                  {' '}
                  {roundTypes.byId[scrambleSet.round_type_id].name}
                  {' - '}
                  {String.fromCharCode(65 + scrambleSet.ordered_index)}
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Accordion.Content>
      </Accordion>
    </Card>
  );
}
