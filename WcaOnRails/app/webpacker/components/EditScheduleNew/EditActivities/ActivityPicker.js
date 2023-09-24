import React from 'react';
import { Container, Label, List, Popup } from 'semantic-ui-react';
import cn from 'classnames';

function ActivityPicker({
  wcifEvents,
}) {
  return (
    <List>
      {wcifEvents.filter((event) => !!event.rounds).map((event, eventIdx) => (
        <List.Item>
          <List.Icon as="span" className={cn('cubing-icon', `event-${event.id}`)} />
          <List.Content>
            {event.rounds.map((round, roundIdx) => (
              <Popup
                content="Activity Title"
                trigger={<Label>{round.id}</Label>}
              />
            ))}
          </List.Content>
        </List.Item>
      ))}
    </List>
  );
}

export default ActivityPicker;
