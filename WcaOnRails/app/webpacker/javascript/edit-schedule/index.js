import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';

import EditSchedule from './EditSchedule';
import {
  calendarHandlers,
  dataToFcEvent,
  fcEventToActivity,
  momentToIso,
  selectedEventInCalendar,
  singleSelectEvent,
  singleSelectLastEvent,
} from './SchedulesEditor/calendar-utils';
import {
  roomWcifFromId,
} from '../wca/wcif-utils';
import {
  newActivityId,
  defaultDurationFromActivityCode,
} from './utils';
import { scheduleElementSelector } from './SchedulesEditor/ses';

const state = {};
let setupCalendarHandlers = () => {};

/* eslint import/no-cycle: "off" */
/* eslint no-alert: "off" */

export default function rootRender() {
  ReactDOM.render(
    <EditSchedule
      competitionInfo={state.competitionInfo}
      locale={state.locale}
      setupCalendarHandlers={setupCalendarHandlers}
    />,
    document.getElementById('edit-schedule-area'),
  );
}

// NOTE: while making this file pretty big, putting these here is the only
// way I found to avoid a circular dependency.
function handleEventModifiedInCalendar(reactElem, event) {
  const room = roomWcifFromId(reactElem.props.scheduleWcif, reactElem.state.selectedRoom);
  const activityIndex = _.findIndex(room.activities, { id: event.id });
  if (activityIndex < 0) {
    throw new Error("This is very very BAD, I couldn't find an activity matching the modified event!");
  }
  const currentActivity = room.activities[activityIndex];
  const updatedActivity = fcEventToActivity(event);
  const activityToMoments = ({ startTime, endTime }) => [
    window.moment(startTime),
    window.moment(endTime),
  ];
  const [currentStart, currentEnd] = activityToMoments(currentActivity);
  const [updatedStart, updatedEnd] = activityToMoments(updatedActivity);
  /* Move and proportionally scale child activities. */
  const lengthRate = updatedEnd.diff(updatedStart) / currentEnd.diff(currentStart);
  updatedActivity.childActivities.forEach((child) => {
    const childActivity = child;
    const [childStart, childEnd] = activityToMoments(childActivity);
    const updatedStartDiff = Math.floor(childStart.diff(currentStart) * lengthRate);
    childActivity.startTime = updatedStart.clone().add(updatedStartDiff, 'ms').utc().format();
    const updatedEndDiff = Math.floor(childEnd.diff(currentStart) * lengthRate);
    childActivity.endTime = updatedStart.clone().add(updatedEndDiff, 'ms').utc().format();
  });
  room.activities[activityIndex] = updatedActivity;
  // We rootRender to display the "Please save your changes..." message
  rootRender();
}

function handleRemoveEventFromCalendar(reactElem, event) {
  /* eslint no-restricted-globals: "off" */
  if (!confirm(`Are you sure you want to remove ${event.title}`)) {
    return false;
  }

  // Remove activityCode from the list used by the ActivityPicker
  const newActivityCodeList = reactElem.state.usedActivityCodeList;
  const activityCodeIndex = newActivityCodeList.indexOf(event.activityCode);
  if (activityCodeIndex < 0) {
    throw new Error("This is BAD, I couldn't find an activity code when removing event!");
  }
  newActivityCodeList.splice(activityCodeIndex, 1);
  const { scheduleWcif } = reactElem.props;
  // Remove activity from the list used by the ActivityPicker
  const room = roomWcifFromId(scheduleWcif, reactElem.state.selectedRoom);
  _.remove(room.activities, { id: event.id });

  // We rootRender to display the "Please save your changes..." message
  reactElem.setState({ usedActivityCodeList: newActivityCodeList }, rootRender());

  $(scheduleElementSelector).fullCalendar('removeEvents', event.id);
  singleSelectLastEvent(scheduleWcif, reactElem.state.selectedRoom);
  return true;
}

function handleAddActivityToCalendar(reactElem, activityData, renderItOnCalendar) {
  const currentEventSelected = selectedEventInCalendar();
  const roomSelected = roomWcifFromId(reactElem.props.scheduleWcif, reactElem.state.selectedRoom);
  if (roomSelected) {
    const newActivity = {
      id: activityData.id || newActivityId(),
      name: activityData.name,
      activityCode: activityData.activityCode,
      childActivities: [],
    };
    if (activityData.startTime && activityData.endTime) {
      newActivity.startTime = activityData.startTime;
      newActivity.endTime = activityData.endTime;
    } else if (currentEventSelected) {
      const newStart = currentEventSelected.end.clone();
      newActivity.startTime = momentToIso(newStart);
      const newEnd = newStart.add(defaultDurationFromActivityCode(newActivity.activityCode), 'm');
      newActivity.endTime = momentToIso(newEnd);
    } else {
      // Do nothing, user cliked an event without any event selected.
      return;
    }
    roomSelected.activities.push(newActivity);
    if (renderItOnCalendar) {
      const fcEvent = dataToFcEvent(newActivity);
      singleSelectEvent(fcEvent);
      $(scheduleElementSelector).fullCalendar('renderEvent', fcEvent);
    }
    // update list of activityCode used, and rootRender to display the save message
    reactElem.setState({
      usedActivityCodeList: [
        ...reactElem.state.usedActivityCodeList,
        newActivity.activityCode,
      ],
    }, rootRender);
  }
}

setupCalendarHandlers = (editor) => {
  calendarHandlers.addActivityToCalendar = _.partial(handleAddActivityToCalendar, editor);
  calendarHandlers.eventModifiedInCalendar = _.partial(handleEventModifiedInCalendar, editor);
  calendarHandlers.removeEventFromCalendar = _.partial(handleRemoveEventFromCalendar, editor);
};

window.wca.initializeScheduleForm = (competitionInfo, locale) => {
  state.competitionInfo = competitionInfo;
  state.locale = locale;
  rootRender();
};
