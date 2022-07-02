import { ChangesSaved, SetScrambleSetCount } from './actions';

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
    unsavedChanges: false,
    initialWcifEvents: state.wcifEvents,
  }),
  [SetScrambleSetCount]: (state, { payload }) => ({
    ...state,
    unsavedChanges: true,
    wcifEvents: updateForRound(state.wcifEvents, payload.wcifRoundId, () => ({
      scrambleSetCount: payload.scrambleSetCount,
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
