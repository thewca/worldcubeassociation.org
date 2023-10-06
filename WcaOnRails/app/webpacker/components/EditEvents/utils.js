import { events, formats } from '../../lib/wca-data.js.erb';
import { buildActivityCode, parseActivityCode } from '../../lib/utils/wcif';
import { matchResult, pluralize } from '../../lib/utils/edit-events';

const DEFAULT_TIME_LIMIT = {
  centiseconds: 10 * 60 * 100,
  cumulativeRoundIds: [],
};

export const generateWcifRound = (eventId, roundNumber) => {
  const event = events.byId[eventId];

  return {
    id: buildActivityCode({
      eventId,
      roundNumber,
    }),
    format: event.recommendedFormat().id,
    timeLimit: event.canChangeTimeLimit ? DEFAULT_TIME_LIMIT : null,
    cutoff: null,
    advancementCondition: null,
    results: [],
    groups: [],
    scrambleSetCount: 1,
  };
};

/**
 * Removes the roundIds from the cumulativeRoundIds of the specified event.
 *
 * @param {collection} wcifEvents Will be modified in place.
 * @param {Array}      roundIdsToRemove Rounds to be removed from all cumulativeRoundIds.
 */
export const removeSharedTimeLimits = (event, roundIdsToRemove) => {
  if (event.rounds) {
    return {
      ...event,
      rounds: event.rounds.map((round) => removeSharedTimeLimitsFromRound(round, roundIdsToRemove)),
    };
  };
  return event;
};

const removeSharedTimeLimitsFromRound = (round, roundIdsToRemove) => {
  if (round.timeLimit) {
    return {
      ...round,
      timeLimit: {
        ...round.timeLimit,
        cumulativeRoundIds: round.timeLimit.cumulativeRoundIds.filter((wcifRoundId) => (
          !roundIdsToRemove.includes(wcifRoundId)
        )),
      },
    };
  };
  return round;
};

export const roundCutoffToString = (wcifRound, { short } = {}) => {
  const { cutoff } = wcifRound;
  if (!cutoff) {
    return '-';
  }

  const { eventId } = parseActivityCode(wcifRound.id);
  const matchStr = matchResult(cutoff.attemptResult, eventId, { short });
  if (short) {
    return `Best of ${cutoff.numberOfAttempts} ${matchStr}`;
  }
  let explanationText = `Competitors get ${pluralize(cutoff.numberOfAttempts, 'attempt')} to get ${matchStr}.`;
  explanationText += ` If they succeed, they get to do all ${formats.byId[wcifRound.format].expectedSolveCount} solves.`;
  return explanationText;
};
