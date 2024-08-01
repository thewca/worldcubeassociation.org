import {
  ClearForm,
  UpdateContactRecipient,
  UpdateSectionData,
} from './actions';

export const getContactFormInitialState = (loggedInUserData, queryParams) => ({
  formValues: {
    userData: {
      name: loggedInUserData?.user?.name,
      email: loggedInUserData?.user?.email,
    },
    contactRecipient: queryParams?.contactRecipient,
    competition: {
      competitionId: queryParams?.competitionId,
      message: queryParams?.message,
    },
    wst: {
      requestId: queryParams?.requestId,
    },
  },
  attachments: [],
});

const reducers = {
  [UpdateSectionData]: (state, { payload }) => ({
    ...state,
    formValues: {
      ...state.formValues,
      [payload.section]: {
        ...(state.formValues[payload.section] || {}),
        [payload.name]: payload.value,
      },
    },
  }),

  [UpdateContactRecipient]: (state, { payload }) => ({
    ...state,
    formValues: {
      ...state.formValues,
      contactRecipient: payload.contactRecipient,
    },
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
