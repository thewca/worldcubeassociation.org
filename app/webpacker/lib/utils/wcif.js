import { useCallback } from 'react';
import { DateTime } from 'luxon';
import { events } from '../wca-data.js.erb';
import I18n from '../i18n';
import { attemptResultToString, attemptResultToMbPoints } from './edit-events';
import useSaveAction from '../hooks/useSaveAction';
import { centisecondsToClockFormat } from '../wca-live/attempts';

export function useSaveWcifAction(formatVersion = '1.1') {
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
      const wcifWithFormat = { formatVersion, ...wcifData };

      save(url, wcifWithFormat, onSuccess, options, onError);
    },
    [save, formatVersion],
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

export const localizeRoundInformation = (eventId, roundTypeId, attempt = null) => {
  const eventName = I18n.t(`events.${eventId}`);
  const roundTypeName = I18n.t(`rounds.${roundTypeId}.name`);

  const roundName = I18n.t('round.name', { event_name: eventName, round_name: roundTypeName });

  if (attempt) {
    const attemptName = I18n.t('attempts.attempt_name', { number: attempt });
    return `${roundName} (${attemptName})`;
  }

  return roundName;
};

export const localizeActivityCode = (activityCode, wcifRound, wcifEvent) => {
  const { eventId, roundNumber, attempt } = parseActivityCode(activityCode);

  const roundTypeId = getRoundTypeId(
    roundNumber,
    wcifEvent.rounds.length,
    Boolean(wcifRound.cutoff),
  );

  return localizeRoundInformation(eventId, roundTypeId, attempt);
};

export const humanizeActivityCode = (activityCode) => {
  if (activityCode.startsWith('other-')) {
    return I18n.t(`activity.${activityCode.substring(6)}`);
  }

  const { eventId, roundNumber, attempt } = parseActivityCode(activityCode);

  const eventName = I18n.t(`events.${eventId}`);
  const roundName = I18n.t('round.round_number', { round_number: roundNumber });

  const eventAndRoundName = `${eventName}, ${roundName}`;

  if (attempt) {
    const attemptName = I18n.t('attempts.attempt_name', { number: attempt });
    return `${eventAndRoundName}, ${attemptName}`;
  }

  return eventAndRoundName;
};

export const shortLabelForActivityCode = (activityCode) => {
  const { roundNumber, attempt } = parseActivityCode(activityCode);

  const labelText = `R${roundNumber}`;

  if (attempt) {
    return `${labelText}A${attempt}`;
  }

  return labelText;
};

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

    const { eventId: cumulativeEventId } = parseActivityCode(cumulativeRound.id);
    const cumulativeEvent = wcifEvents.find((event) => event.id === cumulativeEventId);

    return localizeActivityCode(cumulativeRound.id, cumulativeRound, cumulativeEvent);
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

export function eventQualificationToString(wcifEvent, qualification, { short, isV2 = false } = {}) {
  if (!qualification) {
    return '-';
  }
  let dateString = '-';
  const wcifWhenDate = isV2 ? qualification.latestResultDate : qualification.whenDate;
  if (wcifWhenDate) {
    const whenDate = DateTime
      .fromISO(wcifWhenDate, { zone: 'UTC' })
      .setZone('local'); // We *want* to show this as a local timestamp if you're living west of Greenwich

    dateString = whenDate.toString().substring(0, 10);
  }
  const deadlineString = I18n.t('qualification.deadline.by_date', { date: dateString });
  const event = events.byId[wcifEvent.id];
  const wcifResultType = isV2 ? qualification.resultCondition.scope : qualification.resultType;
  const wcifQualificationType = isV2 ? qualification.resultCondition.type : qualification.type;
  const wcifQualificationLevel = isV2 ? qualification.resultCondition.value : qualification.level;
  switch (wcifResultType) {
    case 'single':
    case 'average':
      if (wcifQualificationType === 'ranking') {
        const messageName = `qualification.${wcifResultType}.ranking`;
        return `${I18n.t(messageName, { ranking: wcifQualificationLevel })} ${deadlineString}`;
      }
      if (wcifQualificationType === 'anyResult' || (wcifQualificationType === 'resultAchieved' && wcifQualificationLevel === null)) {
        const messageName = `qualification.${wcifResultType}.any_result`;
        return `${I18n.t(messageName)} ${deadlineString}`;
      }
      if (event.isTimedEvent) {
        const messageName = `qualification.${wcifResultType}.time`;
        return `${I18n.t(messageName, { time: attemptResultToString(wcifQualificationLevel, wcifEvent.id, short) })} ${deadlineString}`;
      }
      if (event.isFewestMoves) {
        const messageName = `qualification.${wcifResultType}.moves`;
        const moves = wcifResultType === 'average' ? wcifQualificationLevel / 100 : wcifQualificationLevel;
        return `${I18n.t(messageName, { moves })} ${deadlineString}`;
      }
      if (event.isMultipleBlindfolded) {
        const messageName = `qualification.${wcifResultType}.points`;
        return `${I18n.t(messageName, { points: attemptResultToMbPoints(wcifQualificationLevel) })} ${deadlineString}`;
      }
      return '-';
    default:
      return '-';
  }
}

export function advancementConditionToString(wcifRound, { short } = {}) {
  if (!wcifRound.advancementCondition) {
    return null;
  }

  const condition = wcifRound.advancementCondition;
  const shortTag = short ? '.short' : '';

  const roundFormat = I18n.t(`formats${shortTag}.${wcifRound.format}`);

  const { eventId } = parseActivityCode(wcifRound.id);
  const wcaEvent = events.byId[eventId];

  switch (condition.type) {
    case 'ranking':
      return I18n.t(`advancement_condition${shortTag}.ranking`, { ranking: condition.level });
    case 'percent':
      return I18n.t(`advancement_condition${shortTag}.percent`, { percent: condition.level });
    case 'attemptResult':
      if (wcaEvent.isTimedEvent) {
        return I18n.t(`advancement_condition${shortTag}.attempt_result.time`, { round_format: roundFormat, time: centisecondsToClockFormat(condition.level) });
      }

      if (wcaEvent.isFewestMoves) {
        return I18n.t(`advancement_condition${shortTag}.attempt_result.moves`, { round_format: roundFormat, moves: condition.level });
      }

      if (wcaEvent.isMultipleBlindfolded) {
        return I18n.t(`advancement_condition${shortTag}.attempt_result.points`, { round_format: roundFormat, points: attemptResultToMbPoints(condition.level) });
      }

      return null;
    default:
      return null;
  }
}

// WCIF v2 dropped per-round `advancementCondition`: a round's advancement is now
// derived from the *next* round's participationRuleset. Dual Rounds have no real
// advancement out of their first round — everyone proceeds to the colinked round.
export function roundAdvancementToString(wcifRound, wcifEvents, { short } = {}) {
  const { eventId, roundNumber } = parseActivityCode(wcifRound.id);
  const allRounds = wcifEvents.find((event) => event.id === eventId).rounds;

  // The final round never advances anywhere.
  if (roundNumber === allRounds.length) {
    return null;
  }

  if (wcifRound.linkedRounds) {
    const lastLinkedRoundId = wcifRound.linkedRounds
      .toSorted((a, b) => parseActivityCode(a).roundNumber - parseActivityCode(b).roundNumber)
      .at(-1);

    // First round of a Dual Round: all competitors advance to the colinked round.
    if (wcifRound.id !== lastLinkedRoundId) {
      return I18n.t(`advancement_condition${short ? '.short' : ''}.all_advance`);
    }
  }

  // WCIF round numbers are 1-based, so the next round sits at index `roundNumber`.
  const nextSource = allRounds[roundNumber]?.participationRuleset?.participationSource;
  const condition = nextSource?.resultCondition;
  if (!condition) {
    return null;
  }

  return advancementConditionToString({
    ...wcifRound,
    advancementCondition: {
      type: condition.type === 'resultAchieved' ? 'attemptResult' : condition.type,
      level: condition.value,
    },
  }, { short });
}

export function cutoffToString(wcifRound, { short, isV2 } = {}) {
  const { eventId } = parseActivityCode(wcifRound.id);
  const wcaEvent = events.byId[eventId];
  const value = isV2 ? wcifRound.cutoff.resultValue : wcifRound.cutoff.attemptResult;

  if (wcaEvent.isTimedEvent) {
    const time = centisecondsToClockFormat(value);
    return short ? time : I18n.t('cutoff.time', { count: wcifRound.cutoff.numberOfAttempts, time });
  }

  if (wcaEvent.isFewestMoves) {
    const moves = value;
    return short ? moves : I18n.t('cutoff.moves', { count: wcifRound.cutoff.numberOfAttempts, moves });
  }

  if (wcaEvent.isMultipleBlindfolded) {
    const points = attemptResultToMbPoints(value);
    return short ? points : I18n.t('cutoff.points', { count: wcifRound.cutoff.numberOfAttempts, points });
  }

  return null;
}

export function isActivityTimeValid(activity, wcifVenue, wcifSchedule) {
  const { startDate, numberOfDays: days } = wcifSchedule;
  const { startTime, endTime } = activity;

  const competitionLocalStartTime = DateTime.fromISO(startDate)
    .setZone(wcifVenue?.timezone, { keepLocalTime: true });
  const competitionLocalEndTime = DateTime.fromISO(startDate).plus({ days })
    .setZone(wcifVenue?.timezone, { keepLocalTime: true });

  const activityStartTime = DateTime.fromISO(startTime);
  const activityEndTime = DateTime.fromISO(endTime);

  const hasPositiveDuration = activityStartTime < activityEndTime;
  const startsOnOrAfterStartDate = competitionLocalStartTime <= activityStartTime;
  const endsOnOrBeforeEndDate = activityEndTime <= competitionLocalEndTime;

  return hasPositiveDuration && startsOnOrAfterStartDate && endsOnOrBeforeEndDate;
}
