import React from 'react'
import ReactDOM from 'react-dom'

import EditSchedule from './EditSchedule'

function getAuthenticityToken() {
  return document.querySelector('meta[name=csrf-token]').content;
}

export function promiseSaveWcif(wcif) {
  // TODO: endpoint not implemented
  let url = `/api/v0/competitions/${wcif.id}/wcif/schedule`;
  let fetchOptions = {
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": getAuthenticityToken(),
    },
    credentials: 'include',
    method: "PATCH",
    body: JSON.stringify(wcif.schedule),
  };

  return fetch(url, fetchOptions);
}

let state = {};

export function rootRender() {
  ReactDOM.render(
    <EditSchedule competitionInfo={state.competitionInfo} pickerOptions={state.pickerOptions} scheduleWcif={state.scheduleWcif} tzMapping={state.tzMapping} eventsWcif={state.eventsWcif} enableDraggableAction={state.enableDraggableAction} />,
    document.getElementById('edit-schedule-area'),
  )
}

wca.initializeScheduleForm = (competitionInfo, pickerOptions, scheduleWcif, tzMapping, eventsWcif, enableDraggableAction) => {
  state.competitionInfo = competitionInfo;
  state.pickerOptions = pickerOptions;
  state.scheduleWcif = scheduleWcif;
  state.tzMapping = tzMapping;
  state.eventsWcif = eventsWcif;
  state.enableDraggableAction = enableDraggableAction;
  rootRender();
}
