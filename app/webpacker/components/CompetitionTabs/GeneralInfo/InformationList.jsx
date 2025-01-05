import React from 'react';
import { Grid, Header, Icon } from 'semantic-ui-react';

function DataListGridEntry({
  header,
  children,
  icon,
  headerBias = 0,
}) {
  return (
    <>
      <Grid.Row verticalAlign="middle" only="computer">
        <Grid.Column width={4 - headerBias} textAlign="right">
          { icon ? <Icon name={icon} />
            : <Header as="h5">{header}</Header>}
        </Grid.Column>
        <Grid.Column width={12 + headerBias}>
          {children}
        </Grid.Column>
      </Grid.Row>
      <Grid.Row only="tablet mobile">
        <Grid.Column width={16} textAlign="left">
          <b>{header}</b>
          <br />
          {children}
        </Grid.Column>
      </Grid.Row>
    </>
  );
}

export default function InformationList({ items, headerBias = 0 }) {
  return (
    <Grid>
      {items.map((listItem) => (
        <DataListGridEntry
          key={listItem.header}
          header={listItem.header}
          icon={listItem.icon}
          headerBias={headerBias}
        >
          {listItem.content}
        </DataListGridEntry>
      ))}
    </Grid>
  );
}
