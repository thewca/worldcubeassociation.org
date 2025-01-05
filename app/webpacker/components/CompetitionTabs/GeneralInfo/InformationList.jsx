import React from 'react';
import { Grid } from 'semantic-ui-react';
import DataListGridEntry from './DataListGridEntry';

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
