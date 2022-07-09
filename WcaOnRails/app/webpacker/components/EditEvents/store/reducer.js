import { generateWcifRound, removeSharedTimelimits } from '../utils';
import {
  AddEvent,
  AddRounds,
  ChangesSaved,
  RemoveEvent,
  RemoveRounds,
  SetScrambleSetCount,
  UpdateCutoff,
  UpdateTimeLimit,
} from './actions';

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
      }) : removeSharedTimelimits(e, roundIdsToRemove))),
    };
  },

  [AddRounds]: (state, { payload }) => {
    const { eventId, roundsToAddCount } = payload;
    const event = state.wcifEvents.find((e) => e.id === eventId);

    if (!event.rounds) {
      event.rounds = [];
    }

    for (let i = 0; i < roundsToAddCount; i += 1) {
      event.rounds.push(generateWcifRound(event.id, event.rounds.length + 1));
    }

    return {
      ...state,
      wcifEvents: state.wcifEvents.map((e) => (e.id === eventId ? event : e)),
    };
  },

  [RemoveRounds]: (state, { payload }) => {
    const { eventId, roundsToRemoveCount } = payload;
    const event = state.wcifEvents.find((e) => e.id === eventId);

    // For removing shared cumulative timelimits from other rounds
    const roundIdsToRemove = event.rounds.slice(event.rounds.length - roundsToRemoveCount)
      .map((round) => round.id);

    event.rounds = event.rounds.slice(0, event.rounds.length - roundsToRemoveCount);

    if (event.rounds.length > 0) {
      // Final rounds must not have an advance to next round requirement.
      event.rounds[event.rounds.length - 1].advancementCondition = null;
    }

    return {
      ...state,
      wcifEvents: state.wcifEvents.map((e) => (
        e.id === eventId ? event : removeSharedTimelimits(e, roundIdsToRemove)
      )),
    };
  },

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

  [UpdateTimeLimit]: (state, { payload }) => ({
    ...state,
    wcifEvents: updateForRounds(
      state.wcifEvents,
      // If we have a cumulative time limit spanning multiple rounds
      // then we want to also update them too with the same roundId
      [payload.roundId, ...payload.timeLimit.cumulativeRoundIds],
      () => ({
        timeLimit: payload.timeLimit,
      }),
    ),
  }),
};

export default function rootReducer(state, action) {
  const reducer = reducers[action.type];
  if (reducer) {
    return reducer(state, action);
  }
  return state;
}
