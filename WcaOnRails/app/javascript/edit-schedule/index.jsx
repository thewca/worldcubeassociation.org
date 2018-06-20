import React from 'react'
import ReactDOM from 'react-dom'

import EditSchedule from './EditSchedule'

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
