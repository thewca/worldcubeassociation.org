import events from 'wca/events.js.erb'

// This is ported from the Ruby code in solve_time.rb.
function parseMbValue(mbValue) {
  let old = Math.floor(mbValue / 1000000000) !== 0;
  let timeSeconds, attempted, solved;
  if(old) {
    timeSeconds = mbValue % 100000;
    mbValue = Math.floor(mbValue / 100000);
    attempted = mbValue % 100;
    mbValue = Math.floor(mbValue / 100);
    solved = 99 - mbValue % 100;
  } else {
    let missed = mbValue % 100;
    mbValue = Math.floor(mbValue / 100);
    timeSeconds = mbValue % 100000;
    mbValue = Math.floor(mbValue / 100000);
    let difference = 99 - (mbValue % 100);

    solved = difference + missed;
    attempted = solved + missed;
  }

  let timeCentiseconds = timeSeconds == 99999 ? null : timeSeconds * 100;
  return { solved, attempted, timeCentiseconds };
}

// This is ported from the Ruby code in solve_time.rb.
function parsedMbToAttemptResult(parsedMb) {
  let { solved, attempted, timeCentiseconds } = parsedMb;
  let missed = attempted - solved;

  let mm = missed;
  let dd = 99 - (solved - missed);
  let ttttt = Math.floor(timeCentiseconds / 100);
  return (dd * 1e7 + ttttt * 1e2 + mm);
}

// Ported from SolveTime.multibld_attempt_to_points in solve_time.rb.
// See https://www.worldcubeassociation.org/regulations/#9f12c
export function attemptResultToMbPoints(mbValue) {
  let { solved, attempted } = parseMbValue(mbValue);
  let missed = attempted - solved;
  return solved - missed;
}

// Ported from SolveTime.points_to_multibld_attempt in solve_time.rb.
export function mbPointsToAttemptResult(mbPoints) {
  let solved = mbPoints;
  let attempted = mbPoints;
  let timeCentiseconds = 99999*100;
  return parsedMbToAttemptResult({ solved, attempted, timeCentiseconds });
}

export function attemptResultToString(attemptResult, eventId, { short } = {}) {
  let event = events.byId[eventId];
  if(event.isTimedEvent) {
    return centisecondsToString(attemptResult, { short });
  } else if(event.isFewestMoves) {
    return `${attemptResult} moves`;
  } else if(event.isMultipleBlindfolded) {
    return `${attemptResultToMbPoints(attemptResult)} points`;
  } else {
    throw new Error(`Unrecognized event type: ${eventId}`);
  }
}

export function matchResult(attemptResult, eventId, { short } = {}) {
  let event = events.byId[eventId];
  let comparisonString = event.isMultipleBlindfolded ? ">" : "<";
  if(!short) {
    comparisonString = {
      "<": "less than",
      ">": "greater than",
    }[comparisonString];
  }
  return `${comparisonString} ${attemptResultToString(attemptResult, eventId, { short })}`;
}

export function pluralize(count, word, { fixed, abbreviate } = {}) {
  let countStr = (fixed && count % 1 > 0) ? count.toFixed(fixed) : count;
  let countDesc = abbreviate ? word[0] : " " + (count == 1 ? word : word + "s");
  return countStr + countDesc;
}

export const SECOND_IN_CS = 100;
export const MINUTE_IN_CS = 60*SECOND_IN_CS;
export const HOUR_IN_CS = 60*MINUTE_IN_CS;

export function centisecondsToString(centiseconds, { short } = {}) {
  let str = "";

  const hours = centiseconds / HOUR_IN_CS;
  centiseconds %= HOUR_IN_CS;
  if(hours >= 1) {
    str += pluralize(Math.floor(hours), "hour", { abbreviate: short }) + " ";
  }

  let minutes = centiseconds / MINUTE_IN_CS;
  centiseconds %= MINUTE_IN_CS;
  if(minutes >= 1) {
    str += pluralize(Math.floor(minutes), "minute", { abbreviate: short }) + " ";
  }

  let seconds = centiseconds / SECOND_IN_CS;
  if(seconds > 0) {
    str += pluralize(seconds, "second", { fixed: 2, abbreviate: short }) + " ";
  }

  return str.trim();
}

export function roundIdToString(roundId) {
  let { eventId, roundNumber } = parseActivityCode(roundId);
  let event = events.byId[eventId];
  return `${event.name}, Round ${roundNumber}`;
}

// Copied from https://github.com/jfly/tnoodle/blob/c2b529e6292469c23f33b1d73839e22f041443e0/tnoodle-ui/src/WcaCompetitionJson.js#L52
export function parseActivityCode(activityCode) {
  let eventId, roundNumber, group;
  let parts = activityCode.split("-");
  eventId = parts.shift();

  parts.forEach(part => {
    let firstLetter = part[0];
    let rest = part.substring(1);
    if(firstLetter === "r") {
      roundNumber = parseInt(rest, 10);
    } else if(firstLetter === "g") {
      group = rest;
    } else {
      throw new Error(`Unrecognized activity code part: ${part} of ${activityCode}`);
    }
  });
  return { eventId, roundNumber, group };
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
