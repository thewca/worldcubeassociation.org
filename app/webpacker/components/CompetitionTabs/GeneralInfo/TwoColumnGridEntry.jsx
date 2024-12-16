import React from 'react';
import { Grid, Header, Icon } from 'semantic-ui-react';

export default function TwoColumnGridEntry({
  header, children, icon,
}) {
  return (
    <>
      <Grid.Row verticalAlign="middle" style={{ padding: '0em' }} only="computer">
        <Grid.Column width={4} textAlign="right">
          { icon && <Icon name={icon} /> }
          <Header as="h5">{header}</Header>
        </Grid.Column>
        <Grid.Column width={12}>
          {children}
        </Grid.Column>
      </Grid.Row>
      <Grid.Row style={{ padding: '0em' }} only="tablet mobile">
        <Grid.Column width={16} textAlign="left">
          <b>{header}</b>
          <br />
          {children}
        </Grid.Column>
      </Grid.Row>
    </>
  );
}
