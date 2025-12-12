import React from 'react';
import { Header, List, Segment } from 'semantic-ui-react';
import AbortProcess from './MiscActions/AbortProcess';
import EventsMergedData from './MiscActions/EventsMergedData';
import WarningsAndMessageButton from './MiscActions/WarningsAndMessageButton';

export default function MiscActions({ ticketDetails }) {
  return (
    <Segment>
      <Header>Misc Actions</Header>
      <List>
        <List.Item>
          <AbortProcess
            ticketDetails={ticketDetails}
          />
        </List.Item>
        <List.Item>
          <EventsMergedData
            ticketDetails={ticketDetails}
          />
        </List.Item>
        <List.Item>
          <WarningsAndMessageButton
            ticketDetails={ticketDetails}
          />
        </List.Item>
      </List>
    </Segment>
  );
}
