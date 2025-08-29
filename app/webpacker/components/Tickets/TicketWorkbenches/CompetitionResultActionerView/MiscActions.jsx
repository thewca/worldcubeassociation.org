import React from 'react';
import { Header, List, Segment } from 'semantic-ui-react';
import AbortProcess from './MiscActions/AbortProcess';
import EventsMergedData from './MiscActions/EventsMergedData';

export default function MiscActions({ ticketDetails, updateStatus }) {
  return (
    <Segment>
      <Header>Misc Actions</Header>
      <List>
        <List.Item>
          <AbortProcess
            ticketDetails={ticketDetails}
            updateStatus={updateStatus}
          />
        </List.Item>
        <List.Item>
          <EventsMergedData
            ticketDetails={ticketDetails}
          />
        </List.Item>
      </List>
    </Segment>
  );
}
