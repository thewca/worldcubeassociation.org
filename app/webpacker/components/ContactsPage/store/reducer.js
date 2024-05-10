import {
  ClearForm,
  UpdateContactRecipient,
  UpdateSectionData,
} from './actions';

export const getContactFormInitialState = (loggedInUserData, queryParams) => ({
  userData: {
    name: loggedInUserData?.user?.name,
    email: loggedInUserData?.user?.email,
  },
  contactRecipient: queryParams?.contactRecipient,
  competition: {
    competitionId: queryParams?.competitionId,
  },
  wst: {
    requestId: queryParams?.requestId,
  },
});

const reducers = {
  [UpdateSectionData]: (state, { payload }) => ({
    ...state,
    [payload.section]: {
      ...(state[payload.section] || {}),
      [payload.name]: payload.value,
    },
  }),

  [UpdateContactRecipient]: (state, { payload }) => ({
    ...state,
    contactRecipient: payload.contactRecipient,
  }),

  [ClearForm]: (__, { payload }) => (
    getContactFormInitialState(payload.loggedInUserData, payload.queryParams)
  ),
};

export default function rootReducer(state, action) {
  const reducer = reducers[action.type];
  if (reducer) {
    return reducer(state, action);
  }
  return state;
}
