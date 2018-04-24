import React from 'react'
import ReactDOM from 'react-dom'

import EditSchedule from './EditSchedule'

function getAuthenticityToken() {
  return document.querySelector('meta[name=csrf-token]').content;
}

export function promiseSaveWcif(wcif) {
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
    <EditSchedule competitionInfo={state.competitionInfo} locale={state.locale} />,
    document.getElementById('edit-schedule-area'),
  )
}

wca.initializeScheduleForm = (competitionInfo, locale) => {
  state.competitionInfo = competitionInfo;
  state.locale = locale;
  rootRender();
}
