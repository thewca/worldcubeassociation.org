import { events, formats } from '../../lib/wca-data.js.erb';
import { buildActivityCode, parseActivityCode } from '../../lib/utils/wcif';
import { matchResult, pluralize } from '../../lib/utils/edit-events';

const DEFAULT_TIME_LIMIT = {
  centiseconds: 10 * 60 * 100,
  cumulativeRoundIds: [],
};

export const generateWcifRound = (eventId, roundNumber) => {
  const event = events.byId[eventId];
  const participationSource = roundNumber === 1
    ? { type: 'registrations' }
    : { type: 'round', roundId: buildActivityCode({ eventId, roundNumber: roundNumber - 1 }), resultCondition: null };

  return {
    id: buildActivityCode({
      eventId,
      roundNumber,
    }),
    format: event.recommendedFormat().id,
    timeLimit: event.canChangeTimeLimit ? DEFAULT_TIME_LIMIT : null,
    cutoff: null,
    linkedRounds: null,
    participationRuleset: { participationSource, reservedPlaces: null },
    results: [],
    scrambleSetCount: 1,
  };
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
  }
  return round;
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
  }
  return event;
};

export const roundCutoffToString = (wcifRound, { short, isV2 } = {}) => {
  const { cutoff } = wcifRound;
  if (!cutoff) {
    return '-';
  }

  const { eventId } = parseActivityCode(wcifRound.id);
  const resultValue = isV2 ? cutoff.resultValue : cutoff.attemptResult;
  const matchStr = matchResult(resultValue, eventId, { short });
  if (short) {
    return `Best of ${cutoff.numberOfAttempts} ${matchStr}`;
  }
  let explanationText = `Competitors get ${pluralize(cutoff.numberOfAttempts, 'attempt')} to get ${matchStr}.`;
  explanationText += ` If they succeed, they get to do all ${formats.byId[wcifRound.format].expectedSolveCount} solves.`;
  return explanationText;
};

export function v2RulesetToV1Condition(wcifRound, wcifEvent, roundNumber) {
  if (roundNumber >= wcifEvent.rounds.length) {
    return null;
  }

  if (wcifRound.linkedRounds) {
    const lastRoundInLink = wcifRound.linkedRounds[wcifRound.linkedRounds.length - 1];

    if (wcifRound.id !== lastRoundInLink) {
      return {
        type: 'dual',
        level: 100,
      };
    }
  }

  const firstTargetRound = wcifEvent.rounds.find((rd) => {
    const source = rd.participationRuleset.participationSource;

    if (source.type === 'round') {
      return source.roundId === wcifRound.id;
    }

    if (source.type === 'linkedRounds') {
      return source.roundIds.includes(wcifRound.id);
    }

    return false;
  });

  const resultCondition = firstTargetRound
    ?.participationRuleset
    ?.participationSource
    ?.resultCondition;

  if (!resultCondition) return null;

  return {
    type: resultCondition.type.replace('resultAchieved', 'attemptResult'),
    level: resultCondition.value ?? 0,
  };
}
