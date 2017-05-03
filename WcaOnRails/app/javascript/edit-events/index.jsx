import React from 'react'
import ReactDOM from 'react-dom'

import EditEvents from './EditEvents'
import events from 'wca/events.js.erb'

function getAuthenticityToken() {
  return document.querySelector('meta[name=csrf-token]').content;
}

export function promiseSaveWcif(wcif) {
  let url = `/competitions/${wcif.id}/wcif/events`;
  let fetchOptions = {
    headers: new Headers({
      "Content-Type": "application/json",
      "X-CSRF-Token": getAuthenticityToken(),
    }),
    credentials: 'include',
    method: "PATCH",
    body: JSON.stringify(wcif.events),
  };

  return fetch(url, fetchOptions);
}

let state = {};
export function rootRender() {
  ReactDOM.render(
    <EditEvents competitionId={state.competitionId} wcifEvents={state.wcifEvents} />,
    document.getElementById('events-edit-area'),
  )
}

function normalizeWcifEvents(wcifEvents) {
  return events.official.map(event => {
    return wcifEvents.find(wcifEvent => wcifEvent.id == event.id) || { id: event.id, rounds: [] };
  });
}

wca.initializeEventsForm = (competitionId, wcifEvents) => {
  state.competitionId = competitionId;
  state.wcifEvents = normalizeWcifEvents(wcifEvents);
  rootRender();
}
