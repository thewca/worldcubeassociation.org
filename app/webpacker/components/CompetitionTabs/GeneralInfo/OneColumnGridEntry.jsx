import React from 'react';
import { Grid, Header } from 'semantic-ui-react';

export default function ColumnGridEntry({
  header, children,
}) {
  return (
    <>
      <Grid.Row only="computer">
        <Grid.Column width={2} textAlign="right">
          <Header as="h5">{header}</Header>
        </Grid.Column>
        <Grid.Column width={14}>
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
