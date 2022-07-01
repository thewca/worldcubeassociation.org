import formats from '../../lib/wca-data/formats.js.erb';
import events from '../../lib/wca-data/events.js.erb';
import { buildActivityCode, parseActivityCode } from '../../lib/utils/wcif';
import { matchResult, pluralize } from '../../lib/utils/edit-events';

/* eslint-disable import/prefer-default-export */
export function addRoundToEvent(wcifEvent) {
  const DEFAULT_TIME_LIMIT = {
    centiseconds: 10 * 60 * 100,
    cumulativeRoundIds: [],
  };

  const event = events.byId[wcifEvent.id];
  const nextRoundNumber = wcifEvent.rounds.length + 1;

  wcifEvent.rounds.push({
    id: buildActivityCode({
      eventId: wcifEvent.id,
      roundNumber: nextRoundNumber,
    }),
    format: event.recommendedFormat().id,
    timeLimit: DEFAULT_TIME_LIMIT,
    cutoff: null,
    advancementCondition: null,
    results: [],
    groups: [],
    scrambleSetCount: 1,
  });
}

export function roundCutoffToString(wcifRound, { short } = {}) {
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
}

/**
 * Finds the cumulativeRoundIds of each event in wcifEvents and removes any
 * which are found in wcifRounds. Note that it modifies wicfEvents in place.
 *
 * @param {collection} wcifEvents Will be modified in place.
 * @param {Array}      wcifRounds Rounds to be removed from all cumulativeRoundIds.
 */
export function removeRoundsFromSharedTimeLimits(wcifEvents, wcifRounds) {
  _.compact(_.flatMap(wcifEvents, 'rounds')).forEach((otherWcifRound) => {
    // fmc and mbf don't have timelimits
    if (otherWcifRound.timeLimit) {
      _.pull(otherWcifRound.timeLimit.cumulativeRoundIds, ...wcifRounds);
    }
  });
}
