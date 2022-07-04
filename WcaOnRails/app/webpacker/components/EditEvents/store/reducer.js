import { generateWcifRound, removeSharedTimelimits } from '../utils';
import {
  AddRounds, ChangesSaved, RemoveRounds, SetScrambleSetCount, UpdateCutoff,
} from './actions';

const updateForRound = (wcifEvents, roundId, cb) => wcifEvents.map((event) => (event.id === roundId.split('-')[0]
  ? ({
    ...event,
    rounds: event.rounds.map((round) => (round.id === roundId ? {
      ...round,
      ...cb(round),
    } : round)),
  }) : event));

const reducers = {
  [ChangesSaved]: (state) => ({
    ...state,
    initialWcifEvents: state.wcifEvents,
  }),
  [SetScrambleSetCount]: (state, { payload }) => ({
    ...state,
    wcifEvents: updateForRound(state.wcifEvents, payload.roundId, () => ({
      scrambleSetCount: payload.scrambleSetCount,
    })),
  }),
  [UpdateCutoff]: (state, { payload }) => ({
    ...state,
    wcifEvents: updateForRound(state.wcifEvents, payload.roundId, () => ({
      cutoff: payload.cutoff,
    })),
  }),
  [AddRounds]: (state, { payload }) => {
    const { eventId, roundsToAddCount } = payload;
    const event = state.wcifEvents.find((e) => e.id === eventId);

    if (!event.rounds) {
      event.rounds = [];
    }

    console.log(event.rounds.length);
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
};

export default function rootReducer(state, action) {
  const reducer = reducers[action.type];
  if (reducer) {
    return reducer(state, action);
  }
  return state;
}
