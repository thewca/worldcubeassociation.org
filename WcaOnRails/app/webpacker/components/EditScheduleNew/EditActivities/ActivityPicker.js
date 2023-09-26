import React from 'react';
import { Label, List, Popup } from 'semantic-ui-react';
import cn from 'classnames';

function ActivityPicker({
  wcifEvents,
}) {
  return (
    <>
      <List relaxed>
        {wcifEvents.filter((event) => !!event.rounds).map((event, eventIdx) => (
          <List.Item key={eventIdx}>
            <List.Icon
              className={cn('cubing-icon', `event-${event.id}`)}
              verticalAlign="middle"
              size="large"
            />
            <List.Content>
              {event.rounds.map((round, roundIdx) => (
                <Popup
                  key={roundIdx}
                  content="Activity Title"
                  trigger={(
                    <Label
                      className="fc-draggable"
                      color="blue"
                    >
                      {round.id}
                    </Label>
                  )}
                />
              ))}
            </List.Content>
          </List.Item>
        ))}
      </List>
      <p>
        Want to add a custom activity such as lunch or registration?
        Click and select a timeframe on the calendar!
      </p>
    </>
  );
}

export default ActivityPicker;
