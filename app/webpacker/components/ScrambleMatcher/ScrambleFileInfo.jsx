import React, { useState } from 'react';
import {
  Accordion, Card, CardContent, CardDescription, CardHeader, Header, Icon, List, ListItem,
} from 'semantic-ui-react';

export default function ScrambleFileInfo({ uploadedJSON }) {
  const [expanded, setExpanded] = useState(false);
  const { wcif } = uploadedJSON;

  return (
    <Card fluid>
      <Accordion open={expanded} styled fluid>
        <Accordion.Title onClick={() => setExpanded(!expanded)}>
          <CardHeader>
            <Header>
              <Icon name="dropdown" />
              {uploadedJSON.competitionName}
            </Header>
          </CardHeader>
          <CardDescription>
            Generated with
            {' '}
            {uploadedJSON.version}
            <br />
            On
            {' '}
            {uploadedJSON.generationDate}
          </CardDescription>
        </Accordion.Title>
        <Accordion.Content active={expanded}>
          <CardContent style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <List>
              {wcif.events.map((event) => (
                event.rounds.map((round) => (
                  round.scrambleSets.map((scrambleSet) => (
                    <ListItem key={`${round.id}-${scrambleSet.id}`}>
                      {scrambleSet.name}
                    </ListItem>
                  ))
                ))
              ))}
            </List>
          </CardContent>
        </Accordion.Content>
      </Accordion>
    </Card>
  );
}
