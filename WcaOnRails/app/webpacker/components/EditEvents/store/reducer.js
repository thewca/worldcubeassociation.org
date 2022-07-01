import { ChangesSaved } from './actions';

const reducers = {
  [ChangesSaved]: (state) => ({
    ...state,
    unsavedChanges: false,
  }),
};

export default function rootReducer(state, action) {
  const reducer = reducers[action.type];
  if (reducer) {
    return reducer(state, action);
  }
  return state;
}
