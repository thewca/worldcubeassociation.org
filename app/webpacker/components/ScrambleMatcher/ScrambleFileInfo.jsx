import React, { useState } from 'react';
import {
  Accordion, Card, CardContent, CardDescription, CardHeader, Header, Icon, List, ListItem,
} from 'semantic-ui-react';

export default function ScrambleFileInfo({ scramble }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card fluid>
      <Accordion open={expanded} styled fluid>
        <Accordion.Title onClick={() => setExpanded(!expanded)}>
          <CardHeader>
            <Header>
              <Icon name="dropdown" />
              {scramble.competitionName}
            </Header>
          </CardHeader>
          <CardDescription>
            Generated with
            {' '}
            {scramble.version}
            <br />
            On
            {' '}
            {scramble.generationDate}
          </CardDescription>
        </Accordion.Title>
        <Accordion.Content active={expanded}>
          <CardContent>
            <List>
              {scramble.sheets.map((sheet) => (
                <ListItem key={sheet.id}>
                  {sheet.title}
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Accordion.Content>
      </Accordion>
    </Card>
  );
}
