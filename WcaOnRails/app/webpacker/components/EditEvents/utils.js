import formats from '../../lib/wca-data/formats.js.erb';
import events from '../../lib/wca-data/events.js.erb';
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
    timeLimit: event.can_change_time_limit ? DEFAULT_TIME_LIMIT : null,
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
 * @param {Array}      wcifRounds Rounds to be removed from all cumulativeRoundIds.
 */
export const removeSharedTimelimits = (event, wcifRoundIds) => ({
  ...event,
  timeLimit: event.timeLimit ? {
    ...event.timeLimit,
    cumulativeRoundIds: event.cumulativeRoundIds.filter((wcifRoundId) => (
      !wcifRoundIds.includes(wcifRoundId)
    )),
  } : null,
});

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
