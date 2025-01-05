import React from 'react';
import { Grid, Header, Icon } from 'semantic-ui-react';

export default function DataListGridEntry({
  header,
  children,
  icon,
  padded = false,
  headerBias = 0,
}) {
  const style = padded ? {} : { padding: '0em' };

  return (
    <>
      <Grid.Row verticalAlign="middle" style={style} only="computer">
        <Grid.Column width={4 - headerBias} textAlign="right">
          { icon ? <Icon name={icon} />
            : <Header as="h5">{header}</Header>}
        </Grid.Column>
        <Grid.Column width={12 + headerBias}>
          {children}
        </Grid.Column>
      </Grid.Row>
      <Grid.Row style={style} only="tablet mobile">
        <Grid.Column width={16} textAlign="left">
          <b>{header}</b>
          <br />
          {children}
        </Grid.Column>
      </Grid.Row>
    </>
  );
}
