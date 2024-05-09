import { useCallback } from 'react';
import { DateTime } from 'luxon';
import { events } from '../wca-data.js.erb';
import I18n from '../i18n';
import { attemptResultToString, attemptResultToMbPoints } from './edit-events';
import useSaveAction from '../hooks/useSaveAction';
import { centisecondsToClockFormat } from '../wca-live/attempts';

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

// After round_type_id in round.rb
export function getRoundTypeId(roundNumber, totalNumberOfRounds, cutoff = false) {
  if (roundNumber === totalNumberOfRounds) {
    return cutoff ? 'c' : 'f';
  }
  if (roundNumber === 1) {
    return cutoff ? 'd' : '1';
  }
  if (roundNumber === 2) {
    return cutoff ? 'e' : '2';
  }

  return cutoff ? 'g' : '3';
}

export function timeLimitToString(wcifRound, wcifEvents) {
  const wcifTimeLimit = wcifRound.timeLimit;
  const { eventId } = parseActivityCode(wcifRound.id);

  // From WCIF specification:
  // For events with unchangeable time limit (3x3x3 MBLD, 3x3x3 FM) the value is null.
  if (wcifTimeLimit === null) {
    return I18n.t(`time_limit.${eventId}`);
  }

  const timeStr = centisecondsToClockFormat(wcifTimeLimit.centiseconds);

  if (wcifTimeLimit.cumulativeRoundIds.length === 0) {
    return timeStr;
  }

  if (wcifTimeLimit.cumulativeRoundIds.length === 1) {
    return I18n.t('time_limit.cumulative.one_round', { time: timeStr });
  }

  const allWcifRounds = wcifEvents.flatMap((event) => event.rounds);

  const roundStrs = wcifTimeLimit.cumulativeRoundIds.map((cumulativeId) => {
    const cumulativeRound = allWcifRounds.find((round) => round.id === cumulativeId);

    const {
      eventId: cumulativeEventId,
      roundNumber: cumulativeRoundNumber,
    } = parseActivityCode(cumulativeRound.id);

    const cumulativeEvent = wcifEvents.find((event) => event.id === cumulativeEventId);

    const roundTypeId = getRoundTypeId(
      cumulativeRoundNumber,
      cumulativeEvent.rounds.length,
      Boolean(cumulativeRound.cutoff),
    );

    const eventName = I18n.t(`events.${cumulativeEventId}`);
    const roundTypeName = I18n.t(`rounds.${roundTypeId}.name`);

    return I18n.t('round.name', { event_name: eventName, round_name: roundTypeName });
  });

  // TODO: In Rails-world this used "to_sentence" which joins it nicely
  //   with localized "and" translations. Not sure whether we have a JS equivalent,
  //   so resort to using comma instead.
  const roundStr = roundStrs.join(', ');

  return I18n.t('time_limit.cumulative.across_rounds', { time: timeStr, rounds: roundStr });
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

function areISOTimesTheSame(t1, t2) {
  return DateTime.fromISO(t1).toMillis() === DateTime.fromISO(t2).toMillis();
}

export function doActivitiesMatch(a1, a2) {
  return a1.activityCode === a2.activityCode
    && areISOTimesTheSame(a1.startTime, a2.startTime)
    && areISOTimesTheSame(a1.endTime, a2.endTime);
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
    const whenDate = DateTime
      .fromISO(qualification.whenDate, { zone: 'UTC' })
      .setZone('local'); // We *want* to show this as a local timestamp if you're living west of Greenwich

    dateString = whenDate.toString().substring(0, 10);
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
