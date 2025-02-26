import React from 'react';
import { Header, Icon } from 'semantic-ui-react';
import _ from 'lodash';
import { events, WCA_EVENT_IDS } from '../../../lib/wca-data.js.erb';

export default function GroupedEventsTable({
  results,
  children,
}) {
  const resultsByEvent = _.groupBy(results, 'result.eventId');

  const eventIds = Object.keys(resultsByEvent);
  const eventsToRender = WCA_EVENT_IDS.filter((id) => eventIds.includes(id));

  return eventsToRender.map((eventId) => (
    <React.Fragment key={eventId}>
      <Header>
        <Icon className={`cubing-icon event-${eventId}`} />
        {events.byId[eventId].name}
      </Header>
      {children(resultsByEvent[eventId])}
    </React.Fragment>
  ));
}
