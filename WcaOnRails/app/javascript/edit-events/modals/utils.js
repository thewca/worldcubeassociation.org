import events from 'wca/events.js.erb'

export function attemptResultToString(attemptResult, eventId) {
  let event = events.byId[eventId];
  if(event.timed_event) {
    return centisecondsToString(attemptResult);
  } else if(event.fewest_moves) {
    return `${attemptResult} moves`;
  } else if(event.multiple_blindfolded) {
    return `${attemptResult} points`; // TODO <<<>>>
  } else {
    throw new Error(`Unrecognized event type: ${eventId}`);
  }
}

export function centisecondsToString(centiseconds) {
  const seconds = centiseconds / 100;
  const minutes = seconds / 60;
  const hours = minutes / 60;

  // TODO <<< >>>
  if(hours >= 1) {
    return `${hours.toFixed(2)} hours`;
  } else if(minutes >= 1) {
    return `${minutes.toFixed(2)} minutes`;
  } else {
    return `${seconds.toFixed(2)} seconds`;
  }
}

export function roundIdToString(roundId) {
  let [ eventId, roundNumber ] = roundId.split("-");
  roundNumber = parseInt(roundNumber);
  let event = events.byId[eventId];
  return `${event.name}, Round ${roundNumber}`;
}
