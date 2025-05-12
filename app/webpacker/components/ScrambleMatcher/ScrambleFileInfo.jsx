import React, { useState } from 'react';
import {
  Accordion, Card, CardContent, CardHeader, Header, List, ListItem,
} from 'semantic-ui-react';

export default function ScrambleFileInfo({ scramble }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <CardHeader
        content={(
          <Header>
            Generated with
            {' '}
            {scramble.version}
            On
            {' '}
            {scramble.generationDate}
          </Header>
          )}
      />
      <Accordion open={expanded} onTitleClick={() => setExpanded(!expanded)}>
        <CardContent>
          <List>
            {scramble.sheets.map((sheet) => (
              <ListItem key={sheet.id}>
                {sheet.title}
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Accordion>
    </Card>
  );
}
