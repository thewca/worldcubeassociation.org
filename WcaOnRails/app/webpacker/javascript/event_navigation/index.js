import classnames from 'classnames';
import { Popup, Menu } from 'semantic-ui-react';
import React from 'react';
import EventIcon from '../wca/EventIcon';
import events from '../wca/events.js.erb';
import './index.scss';

const EventNavigation = ({ selected, eventIds, onSelect }) => (
  <Menu text>
    {eventIds.map((event, index) => (
      <Popup
        key={event}
        content={events.byId[event].name}
        trigger={(
          <Menu.Item>
            <EventIcon
              key={event}
              id={event}
              onClick={() => onSelect(eventIds[index], index)}
              className={classnames(selected === event && 'selected')}
            />
          </Menu.Item>
            )}
        inverted
        size="tiny"
      />
    ))}
  </Menu>
);

export default EventNavigation;
