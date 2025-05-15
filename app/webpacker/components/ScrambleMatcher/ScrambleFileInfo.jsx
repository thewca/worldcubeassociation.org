import React, { useState } from 'react';
import {
  Accordion, Card, Header, Icon, List,
} from 'semantic-ui-react';
import { events, roundTypes } from '../../lib/wca-data.js.erb';

export default function ScrambleFileInfo({ uploadedJSON }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card fluid>
      <Accordion open={expanded} styled fluid>
        <Accordion.Title onClick={() => setExpanded((wasExpanded) => !wasExpanded)}>
          <Card.Header>
            <Header>
              <Icon name="dropdown" />
              {uploadedJSON.original_filename}
            </Header>
          </Card.Header>
          <Card.Description>
            Generated with
            {' '}
            {uploadedJSON.scramble_program}
            <br />
            On
            {' '}
            {uploadedJSON.generated_at}
          </Card.Description>
        </Accordion.Title>
        <Accordion.Content active={expanded}>
          <Card.Content>
            <List style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {uploadedJSON.inbox_scramble_sets.map((scrambleSet) => (
                <List.Item key={scrambleSet.id}>
                  {events.byId[scrambleSet.event_id].name}
                  {' '}
                  {roundTypes.byId[scrambleSet.round_type_id].name}
                  {' - '}
                  {String.fromCharCode(65 + scrambleSet.ordered_index)}
                </List.Item>
              ))}
            </List>
          </Card.Content>
        </Accordion.Content>
      </Accordion>
    </Card>
  );
}
