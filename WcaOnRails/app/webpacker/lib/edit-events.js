import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';

/* eslint import/no-named-as-default: "off" */
/* eslint import/no-named-as-default-member: "off" */
/* eslint import/no-cycle: "off" */
import EditEvents from '../components/EditEvents';
import { events } from './wca-data.js.erb';

const state = {};
export default function rootRender() {
  ReactDOM.render(
    <EditEvents
      competitionId={state.competitionId}
      canAddAndRemoveEvents={state.canAddAndRemoveEvents}
      canUpdateEvents={state.canUpdateEvents}
      wcifEvents={state.wcifEvents}
    />,
    document.getElementById('events-edit-area'),
  );
}

function normalizeWcifEvents(wcifEvents) {
  // Since we want to support deprecated events and be able to edit their rounds,
  // we want to show deprecated events if they exist in the WCIF, but not if they
  // don't.
  // Therefore we first build the list of events from the official one, updating
  // it with WCIF data if any.
  // And then we add all events that are still in the WCIF (which means they are
  // not official anymore).
  const ret = events.official.map((event) => _.remove(
    wcifEvents,
    { id: event.id },
  )[0] || { id: event.id, rounds: null });
  return ret.concat(wcifEvents);
}

window.wca.initializeEventsForm = (
  competitionId,
  canAddAndRemoveEvents,
  canUpdateEvents,
  wcifEvents,
) => {
  state.competitionId = competitionId;
  state.canAddAndRemoveEvents = canAddAndRemoveEvents;
  state.canUpdateEvents = canUpdateEvents;
  state.wcifEvents = normalizeWcifEvents(wcifEvents);
  rootRender();
};
