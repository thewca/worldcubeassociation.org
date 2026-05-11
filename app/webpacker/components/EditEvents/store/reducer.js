import _ from 'lodash';
import {
  generateWcifRound,
  removeSharedTimeLimits,
  v2RulesetToV1Condition,
} from '../utils';
import {
  AddEvent,
  AddRounds,
  ChangesSaved,
  RemoveEvent,
  RemoveRounds,
  SetScrambleSetCount,
  UpdateRoundFormat,
  UpdateAdvancementCondition,
  UpdateCutoff,
  UpdateQualification,
  UpdateTimeLimit,
} from './actions';
import { formats } from '../../../lib/wca-data.js.erb';
import { parseActivityCode } from '../../../lib/utils/wcif';

/**
 * Updates 1 or more rounds
 * @param {Event[]} wcifEvents
 * @param {ActivityCode[]} roundIds
 * @param {function(Round): Partial<Round>} mapper
 * @returns {Event[]}
 */
const updateForRounds = (wcifEvents, roundIds, mapper) => wcifEvents.map((event) => ({
  ...event,
  rounds: event?.rounds?.length
    ? event.rounds.map((round) => (roundIds.includes(round.id) ? {
      ...round,
      ...mapper(round),
    } : round)) : event.rounds,
}));

const upcycleAdvancementCondition = (round) => {
  const { advancementCondition: advCondition, format: formatId } = round;

  const formatInfo = formats.byId[formatId];
  const sortingScope = formatInfo.sortBy;

  return {
    type: advCondition.type.replace('attemptResult', 'resultAchieved'),
    scope: sortingScope,
    value: advCondition.level,
  };
};

const generateParticipationSource = (round, allRounds) => {
  const { roundNumber } = parseActivityCode(round.id);

  if (roundNumber === 1) {
    return { type: 'registrations' };
  }

  if (round.linkedRounds) {
    const firstRoundId = round.linkedRounds[0];

    if (firstRoundId !== round.id) {
      const firstInLink = allRounds.find((rd) => rd.id === firstRoundId);

      return generateParticipationSource(firstInLink, allRounds);
    }
  }

  const previousRound = allRounds[roundNumber - 2]; // roundNumber is 1-based, array is 0-indexed

  if (previousRound.linkedRounds) {
    const lastRoundId = previousRound.linkedRounds[previousRound.linkedRounds.length - 1];
    const lastInLink = allRounds.find((rd) => rd.id === lastRoundId);

    return {
      type: 'linkedRounds',
      roundIds: previousRound.linkedRounds,
      resultCondition: upcycleAdvancementCondition(lastInLink),
    };
  }

  return {
    type: 'round',
    roundId: previousRound.id,
    resultCondition: upcycleAdvancementCondition(previousRound),
  };
};

const reducers = {
  [ChangesSaved]: (state) => ({
    ...state,
    initialWcifEvents: state.wcifEvents,
  }),

  [AddEvent]: (state, { payload }) => ({
    ...state,
    wcifEvents: state.wcifEvents.map((event) => (event.id === payload.eventId ? ({
      ...event,
      rounds: [],
    }) : event)),
  }),

  [RemoveEvent]: (state, { payload }) => {
    const { eventId } = payload;
    const event = state.wcifEvents.find((e) => e.id === eventId);
    const roundIdsToRemove = event.rounds.map((round) => round.id);

    return {
      ...state,
      wcifEvents: state.wcifEvents.map((e) => (e.id === payload.eventId ? ({
        id: e.id,
        rounds: null,
      }) : removeSharedTimeLimits(e, roundIdsToRemove))),
    };
  },

  [AddRounds]: (state, { payload }) => {
    const { eventId, roundsToAddCount } = payload;

    const event = state.wcifEvents.find((e) => e.id === eventId);
    const existingRounds = event.rounds ?? [];

    const newRounds = Array(roundsToAddCount).fill(null).map((_, i) => (
      generateWcifRound(eventId, existingRounds.length + i + 1)
    ));

    return {
      ...state,
      wcifEvents: state.wcifEvents.map((e) => (e.id === eventId ? ({
        ...e, rounds: [...existingRounds, ...newRounds],
      }) : e)),
    };
  },

  [RemoveRounds]: (state, { payload }) => {
    const { eventId, roundsToRemoveCount } = payload;

    const event = state.wcifEvents.find((e) => e.id === eventId);

    // For removing shared cumulative time limits from other rounds
    const roundIdsToRemove = event.rounds.slice(event.rounds.length - roundsToRemoveCount)
      .map((round) => round.id);

    // Creating a copy because otherwise, we would be mutating a reference that points to
    // our reducer's state (and if you just only openend the page, also to the initialWcif state!)
    const newEvent = {
      ...event,
      rounds: event.rounds.slice(0, event.rounds.length - roundsToRemoveCount),
    };

    return {
      ...state,
      wcifEvents: state.wcifEvents.map((e) => (
        e.id === eventId ? newEvent : removeSharedTimeLimits(e, roundIdsToRemove)
      )),
    };
  },

  [UpdateRoundFormat]: (state, { payload }) => ({
    ...state,
    wcifEvents: updateForRounds(state.wcifEvents, [payload.roundId], () => ({
      format: payload.format,
    })),
  }),

  [SetScrambleSetCount]: (state, { payload }) => ({
    ...state,
    wcifEvents: updateForRounds(state.wcifEvents, [payload.roundId], () => ({
      scrambleSetCount: payload.scrambleSetCount,
    })),
  }),

  [UpdateCutoff]: (state, { payload }) => ({
    ...state,
    wcifEvents: updateForRounds(state.wcifEvents, [payload.roundId], () => ({
      cutoff: payload.cutoff,
    })),
  }),

  [UpdateTimeLimit]: (state, { payload }) => {
    // payload may have a new group of round ids to share a cumulative time limit;
    // if not, it itself may have formerly been in a cumulative time limit
    // so first, remove all those rounds (or the round itself) from _all_ cumulative time limits
    const eventsWithRoundsRemovedFromCumulativeTimeLimits = updateForRounds(
      state.wcifEvents,
      state.wcifEvents.flatMap((event) => event.rounds?.map((round) => round.id) ?? []),
      (round) => (round.timeLimit?.cumulativeRoundIds ? {
        timeLimit: {
          ...round.timeLimit,
          cumulativeRoundIds: round.timeLimit.cumulativeRoundIds.filter((roundId) => ![
            payload.roundId,
            ...payload.timeLimit.cumulativeRoundIds,
          ].includes(roundId)),
        },
      } : {}),
    );

    // then, add the (potential) new shared cumulative time limit to _all involved rounds_
    return {
      ...state,
      wcifEvents: updateForRounds(
        eventsWithRoundsRemovedFromCumulativeTimeLimits,
        [payload.roundId, ...payload.timeLimit.cumulativeRoundIds],
        () => ({ timeLimit: payload.timeLimit }),
      ),
    };
  },

  [UpdateAdvancementCondition]: (state, { payload }) => {
    const { roundId, advancementCondition } = payload;
    const { eventId } = parseActivityCode(roundId);

    // Stupid but effective approach:
    // 1. Backport everything into a V1 structure,
    // 2. apply the advancementCondition changes that the user did in the UI,
    // 3. finally glue it all together into V2 WCIF again.
    const currentEvent = state.wcifEvents.find((evt) => evt.id === eventId);

    // Re 1: Backport data into V1 shape
    const backportedRounds = currentEvent.rounds.map((rd, idx) => ({
      ...rd,
      advancementCondition: v2RulesetToV1Condition(rd, currentEvent, idx + 1),
    }));

    // Re 2: Apply the change that the user made in the UI
    const patchedRounds = backportedRounds.map((rd) => (rd.id === roundId ? ({
      ...rd,
      advancementCondition,
    }) : rd));

    // Re 3: Glue it all into WCIFv2 again in multiple steps
    const upcycledRounds = patchedRounds.map((rd, idx, allRds) => {
      // First compute the link(s)
      const isDual = (r) => r.advancementCondition?.type === 'dual';

      const headOfLink = _.takeRightWhile(allRds.slice(0, idx), isDual);
      const tailOfLink = _.takeWhile(allRds.slice(idx), isDual);

      const linkedRoundCandidates = allRds.slice(
        idx - headOfLink.length,
        idx + tailOfLink.length + 1,
      );

      const linkedRounds = linkedRoundCandidates.length > 1
        ? linkedRoundCandidates.map((candidate) => candidate.id)
        : null;

      return ({ ...rd, linkedRounds });
    }).map((rd, idx, allRds) => _.omit({
      ...rd,
      // Then once we know the links we can compute `participationSource`
      participationRuleset: {
        ...rd.participationRuleset,
        participationSource: generateParticipationSource(rd, allRds),
      },
      // kick out the backported V1 keys
      advancementCondition: undefined,
    }, ['advancementCondition']));

    return ({
      ...state,
      wcifEvents: state.wcifEvents.map((evt) => (evt.id === eventId ? ({
        ...evt,
        rounds: upcycledRounds,
      }) : evt)),
    });
  },

  [UpdateQualification]: (state, { payload }) => ({
    ...state,
    wcifEvents: state.wcifEvents.map((event) => (event.id === payload.eventId ? ({
      ...event,
      qualification: payload.qualification,
    }) : event)),
  }),
};

export default function rootReducer(state, action) {
  const reducer = reducers[action.type];
  if (reducer) {
    return reducer(state, action);
  }
  return state;
}
