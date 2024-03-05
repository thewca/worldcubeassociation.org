import classnames from 'classnames';
import { Popup, Menu } from 'semantic-ui-react';
import React from 'react';
import EventIcon from './wca/EventIcon';
import { events } from '../lib/wca-data.js.erb';
import '../stylesheets/event_navigation.scss';

function EventNavigation({ selected, eventIds, onSelect }) {
  return (
    <Menu text className="event-menu-bar">
      {eventIds.map((eventId, index) => (
        <Popup
          key={eventId}
          content={events.byId[eventId].name}
          trigger={(
            <Menu.Item>
              <EventIcon
                key={eventId}
                id={eventId}
                onClick={() => onSelect(eventId, index)}
                className={classnames(selected === eventId && 'selected')}
              />
            </Menu.Item>
            )}
          inverted
          size="tiny"
        />
      ))}
    </Menu>
  );
}

export default EventNavigation;
