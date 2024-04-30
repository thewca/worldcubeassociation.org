import {
  UpdateContactRecipient,
  UpdateSectionData,
} from './actions';

const reducers = {
  [UpdateSectionData]: (state, { payload }) => ({
    ...state,
    [payload.section]: {
      ...state[payload.section],
      [payload.name]: payload.value,
    },
  }),

  [UpdateContactRecipient]: (state, { payload }) => ({
    ...state,
    contactRecipient: payload.contactRecipient,
  }),
};

export default function rootReducer(state, action) {
  const reducer = reducers[action.type];
  if (reducer) {
    return reducer(state, action);
  }
  return state;
}
