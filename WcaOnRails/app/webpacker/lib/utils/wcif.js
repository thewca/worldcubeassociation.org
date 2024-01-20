import { useCallback } from 'react';
import { events } from '../wca-data.js.erb';
import I18n from '../i18n';
import { attemptResultToString, attemptResultToMbPoints } from './edit-events';
import useSaveAction from '../hooks/useSaveAction';

export function useSaveWcifAction() {
  const { save, saving } = useSaveAction();

  const alertWcifError = (err) => {
    /* eslint-disable-next-line */
    alert(`Something went wrong while saving.\n${err.message}`);
  };

  const saveWcif = useCallback(
    (
      competitionId,
      wcifData,
      onSuccess,
      options = {},
      onError = alertWcifError,
    ) => {
      const url = `/api/v0/competitions/${competitionId}/wcif`;

      save(url, wcifData, onSuccess, options, onError);
    },
    [save],
  );

  return {
    saveWcif,
    saving,
  };
}

// Copied from https://github.com/jfly/tnoodle/blob/c2b529e6292469c23f33b1d73839e22f041443e0/tnoodle-ui/src/WcaCompetitionJson.js#L52
export function parseActivityCode(activityCode) {
  let roundNumber; let group; let
    attempt;
  const parts = activityCode.split('-');
  const eventId = parts.shift();

  parts.forEach((part) => {
    const firstLetter = part[0];
    const rest = part.substring(1);
    if (firstLetter === 'r') {
      roundNumber = parseInt(rest, 10);
    } else if (firstLetter === 'g') {
      group = rest;
    } else if (firstLetter === 'a') {
      attempt = rest;
    } else {
      throw new Error(`Unrecognized activity code part: ${part} of ${activityCode}`);
    }
  });
  return {
    eventId, roundNumber, group, attempt,
  };
}

export function roundIdToString(roundId) {
  const { eventId, roundNumber } = parseActivityCode(roundId);
  const event = events.byId[eventId];
  return `${event.name}, Round ${roundNumber}`;
}

export function buildActivityCode(activity) {
  let activityCode = activity.eventId;
  if (activity.roundNumber) {
    activityCode += `-r${activity.roundNumber}`;
  }
  if (activity.group) {
    activityCode += `-g${activity.group}`;
  }

  return activityCode;
}

export function roomWcifFromId(scheduleWcif, id) {
  const intId = parseInt(id, 10);
  return scheduleWcif.venues.flatMap((venue) => venue.rooms).find((room) => room.id === intId);
}

export function venueWcifFromRoomId(scheduleWcif, id) {
  const intId = parseInt(id, 10);
  return scheduleWcif.venues.find((venue) => venue.rooms.some((room) => room.id === intId));
}

export function activityWcifFromId(scheduleWcif, id) {
  return scheduleWcif.venues.flatMap(
    ({ rooms }) => rooms.flatMap(({ activities }) => activities),
  ).find((activity) => activity.id === id);
}

export function doActivitiesMatch(a1, a2) {
  return a1.activityCode === a2.activityCode
    && a1.startTime === a2.startTime
    && a1.endTime === a2.endTime;
}

export function getMatchingActivities(scheduleWcif, activity) {
  return scheduleWcif.venues.flatMap(
    ({ rooms }) => rooms.flatMap(({ activities }) => activities),
  ).filter((act) => doActivitiesMatch(act, activity));
}

export function eventQualificationToString(wcifEvent, qualification, { short } = {}) {
  if (!qualification) {
    return '-';
  }
  let dateString = '-';
  if (qualification.whenDate) {
    const whenDate = window.moment(qualification.whenDate).toDate();
    dateString = whenDate.toISOString().substring(0, 10);
  }
  const deadlineString = I18n.t('qualification.deadline.by_date', { date: dateString });
  const event = events.byId[wcifEvent.id];
  switch (qualification.resultType) {
    case 'single':
    case 'average':
      if (qualification.type === 'ranking') {
        const messageName = `qualification.${qualification.resultType}.ranking`;
        return `${I18n.t(messageName, { ranking: qualification.level })} ${deadlineString}`;
      }
      if (qualification.type === 'anyResult') {
        const messageName = `qualification.${qualification.resultType}.any_result`;
        return `${I18n.t(messageName)} ${deadlineString}`;
      }
      if (event.isTimedEvent) {
        const messageName = `qualification.${qualification.resultType}.time`;
        return `${I18n.t(messageName, { time: attemptResultToString(qualification.level, wcifEvent.id, short) })} ${deadlineString}`;
      }
      if (event.isFewestMoves) {
        const messageName = `qualification.${qualification.resultType}.moves`;
        const moves = qualification.resultType === 'average' ? qualification.level / 100 : qualification.level;
        return `${I18n.t(messageName, { moves })} ${deadlineString}`;
      }
      if (event.isMultipleBlindfolded) {
        const messageName = `qualification.${qualification.resultType}.points`;
        return `${I18n.t(messageName, { points: attemptResultToMbPoints(qualification.level) })} ${deadlineString}`;
      }
      return '-';
    default:
      return '-';
  }
}
