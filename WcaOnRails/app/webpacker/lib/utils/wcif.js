import _ from 'lodash';
import events from '../wca-data/events.js.erb';
import { fetchWithAuthenticityToken } from '../requests/fetchWithAuthenticityToken';
import I18n from '../i18n';
import { attemptResultToString } from './edit-events';


function promiseSaveWcif(competitionId, data) {
  const url = `/api/v0/competitions/${competitionId}/wcif`;
  const fetchOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    method: 'PATCH',
    body: JSON.stringify(data),
  };

  return fetchWithAuthenticityToken(url, fetchOptions);
}

export function getAuthenticityToken() {
  return document.querySelector('meta[name=csrf-token]').content;
}

export function saveWcif(competitionId, data, onSuccess, onFailure) {
  promiseSaveWcif(competitionId, data)
    .then((response) => Promise.all([response, response.json()]))
    .then(([response, json]) => {
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}\n${json.error}`);
      }
      onSuccess();
    })
    .catch((e) => {
      onFailure();
      /* eslint-disable-next-line */
      alert(`Something went wrong while saving.\n${e.message}`);
    });
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
  return _.find(_.flatMap(scheduleWcif.venues, 'rooms'), { id: intId });
}

export function venueWcifFromRoomId(scheduleWcif, id) {
  const intId = parseInt(id, 10);
  return _.find(scheduleWcif.venues, (venue) => _.some(venue.rooms, { id: intId }));
}

export function activityCodeListFromWcif(scheduleWcif) {
  return _.map(_.flatMap(_.flatMap(scheduleWcif.venues, 'rooms'), 'activities'), 'activityCode');
}

export function eventQualificationToString(wcifEvent, qualification, { short } = {}) {
  if (!qualification) {
    return "-";
  }
  let dateString = "-";
  if (qualification.whenDate) {
    let whenDate = moment(qualification.whenDate).toDate();
    dateString = whenDate.toISOString().substring(0, 10);
  }
  let deadlineString = I18n.t('qualification.deadline.by_date', { date: dateString })
  switch (qualification.type) {
    case "ranking":
      return `${ I18n.t('qualification.ranking', { ranking: qualification.level } )} ` + deadlineString
    case "single":
    case "average": 
      const event = events.byId[wcifEvent.id];
      if (event.isTimedEvent) {
        return `${ I18n.t('qualification.' + qualification.type + '.time', { time: attemptResultToString(qualification.level) } ) } ` + deadlineString;
      } if (event.isFewestMoves) {
        return `${ I18n.t('qualification.' + qualification.type + '.moves', { moves: qualification.level } ) } ` + deadlineString;
      } if (event.isMultipleBlindfolded) { 
        return `${ I18n.t('qualification.' + qualification.type + '.points', { points: qualification.level } ) } ` + deadlineString;
      }
  }
}
