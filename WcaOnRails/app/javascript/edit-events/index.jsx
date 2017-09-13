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
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": getAuthenticityToken(),
    },
    credentials: 'include',
    method: "PATCH",
    body: JSON.stringify(wcif.events),
  };

  return fetch(url, fetchOptions);
}

let state = {};
export function rootRender() {
  ReactDOM.render(
    <EditEvents competitionId={state.competitionId} competitionConfirmed={state.competitionConfirmed} wcifEvents={state.wcifEvents} />,
    document.getElementById('events-edit-area'),
  )
}

function normalizeWcifEvents(wcifEvents) {
  return events.official.map(event => {
    return _.find(wcifEvents, { id: event.id }) || { id: event.id, rounds: null };
  });
}

wca.initializeEventsForm = (competitionId, competitionConfirmed, wcifEvents) => {
  state.competitionId = competitionId;
  state.competitionConfirmed = competitionConfirmed;
  state.wcifEvents = normalizeWcifEvents(wcifEvents);
  rootRender();
}
