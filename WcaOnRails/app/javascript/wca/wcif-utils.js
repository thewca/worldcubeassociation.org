import events from './events.js.erb'

function promiseSaveWcif(competitionId, data) {
  let url = `/api/v0/competitions/${competitionId}/wcif`;
  let fetchOptions = {
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": getAuthenticityToken(),
    },
    credentials: 'include',
    method: "PATCH",
    body: JSON.stringify(data),
  };

  return fetch(url, fetchOptions);
}

export function getAuthenticityToken() {
  return document.querySelector('meta[name=csrf-token]').content;
}

export function saveWcif(competitionId, data, onSuccess, onFailure) {
  promiseSaveWcif(competitionId, data).then(response => {
    return Promise.all([response, response.json()]);
  }).then(([response, json]) => {
    if(!response.ok) {
      throw new Error(`${response.status}: ${response.statusText}\n${json.error}`);
    }
    onSuccess();
  }).catch(e => {
    onFailure();
    alert(`Something went wrong while saving.\n${e.message}`);
  });
}

export function roundIdToString(roundId) {
  let { eventId, roundNumber } = parseActivityCode(roundId);
  let event = events.byId[eventId];
  return `${event.name}, Round ${roundNumber}`;
}

// Copied from https://github.com/jfly/tnoodle/blob/c2b529e6292469c23f33b1d73839e22f041443e0/tnoodle-ui/src/WcaCompetitionJson.js#L52
export function parseActivityCode(activityCode) {
  let eventId, roundNumber, group, attempt;
  let parts = activityCode.split("-");
  eventId = parts.shift();

  parts.forEach(part => {
    let firstLetter = part[0];
    let rest = part.substring(1);
    if(firstLetter === "r") {
      roundNumber = parseInt(rest, 10);
    } else if(firstLetter === "g") {
      group = rest;
    } else if(firstLetter === "a") {
      attempt = rest;
    } else {
      throw new Error(`Unrecognized activity code part: ${part} of ${activityCode}`);
    }
  });
  return { eventId, roundNumber, group, attempt };
}

export function buildActivityCode(activity) {
  let activityCode = activity.eventId;
  if(activity.roundNumber) {
    activityCode += "-r" + activity.roundNumber;
  }
  if(activity.group) {
    activityCode += "-g" + activity.group;
  }

  return activityCode;
}

export function roomWcifFromId(scheduleWcif, id) {
  id = parseInt(id);
  return _.find(_.flatMap(scheduleWcif.venues, 'rooms'), { id });
}

export function venueWcifFromRoomId(scheduleWcif, id) {
  id = parseInt(id);
  return _.find(scheduleWcif.venues, venue => _.some(venue.rooms, { id }));
}

export function activityCodeListFromWcif(scheduleWcif) {
  return _.map(_.flatMap(_.flatMap(scheduleWcif.venues, 'rooms'), 'activities'), 'activityCode');
}
