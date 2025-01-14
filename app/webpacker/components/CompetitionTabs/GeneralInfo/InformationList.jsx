import React from 'react';
import { List } from 'semantic-ui-react';

function DataListGridEntry({
  header,
  children,
  icon,
}) {
  return (
    <List.Item>
      {icon && <List.Icon name={icon} />}
      <List.Content>
        <List.Header as="h5">{header}</List.Header>
        <List.Description>{children}</List.Description>
      </List.Content>
    </List.Item>
  );
}

export default function InformationList({ items }) {
  return (
    <List relaxed>
      {items.map((listItem) => (
        <DataListGridEntry
          key={listItem.header}
          header={listItem.header}
          icon={listItem.icon}
        >
          {listItem.content}
        </DataListGridEntry>
      ))}
    </List>
  );
}
