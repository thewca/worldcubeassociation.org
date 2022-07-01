import { ChangesSaved, SetScrambleSetCount } from './actions';

const reducers = {
  [ChangesSaved]: (state) => ({
    ...state,
    unsavedChanges: false,
  }),
  [SetScrambleSetCount]: (state, { payload }) => ({
    ...state,
    wcifEvents: state.wcifEvents.map((event) => ({
      ...event,
      rounds: event?.rounds?.map((round) => (round.id === payload.wcifRoundId
        ? ({
          ...round,
          scrambleSetCount: payload.scrambleSetCount,
        })
        : round)),
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
