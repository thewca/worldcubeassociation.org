import React from 'react'
import ReactDOM from 'react-dom'

import EditEvents from './EditEvents'
import events from 'wca/events.js.erb'

let state = {};
export function rootRender() {
  ReactDOM.render(
    <EditEvents competitionId={state.competitionId} canAddAndRemoveEvents={state.canAddAndRemoveEvents} wcifEvents={state.wcifEvents} />,
    document.getElementById('events-edit-area'),
  )
}

function normalizeWcifEvents(wcifEvents) {
  return events.official.map(event => {
    return _.find(wcifEvents, { id: event.id }) || { id: event.id, rounds: null };
  });
}

wca.initializeEventsForm = (competitionId, canAddAndRemoveEvents, wcifEvents) => {
  state.competitionId = competitionId;
  state.canAddAndRemoveEvents = canAddAndRemoveEvents;
  state.wcifEvents = normalizeWcifEvents(wcifEvents);
  rootRender();
}
