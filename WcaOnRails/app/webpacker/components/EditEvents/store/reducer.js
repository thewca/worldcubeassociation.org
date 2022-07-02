import { ChangesSaved, SetScrambleSetCount, UpdateCutoff } from './actions';

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
};

export default function rootReducer(state, action) {
  const reducer = reducers[action.type];
  if (reducer) {
    return reducer(state, action);
  }
  return state;
}
