import React from 'react';
import {
  Tab,
  TabPane,
} from 'semantic-ui-react';
import { events } from '../../../lib/wca-data.js.erb';
import EventIcon from "../../wca/EventIcon";
import eventIcon from "../../wca/EventIcon";

export default function Results({
  person,
}) {
  const sortedEvents = [...events.official];
  const personEvents = new Set(person.results.map((r) => r.eventId));

  Object.keys(events.byId).forEach((key) => {
    if (personEvents.has(key)) {
      if (!sortedEvents.find((e) => e.id === key)) {
        sortedEvents.push(events.byId[key]);
      }
    } else {
      const idx = sortedEvents.findIndex((e) => e.id === key);
      if (idx > -1) {
        sortedEvents.splice(idx);
      }
    }
  });

  const panes = [
    {
      menuItem: 'Tab 1',
      render: () => <TabPane attached={false}>Tab 1 Content</TabPane>,
    },
    {
      menuItem: () => (<>'Tab 2'</>),
      render: () => <TabPane attached={false}>Tab 2 Content</TabPane>,
    },
    {
      menuItem: 'Tab 3',
      render: () => <TabPane attached={false}>Tab 3 Content</TabPane>,
    },
  ];

  return <Tab menu={{ secondary: true, pointing: true }} panes={panes} />;
}
