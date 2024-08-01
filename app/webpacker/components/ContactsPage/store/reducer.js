import {
  ClearForm,
  UpdateContactRecipient,
  UpdateSectionData,
} from './actions';

export const getContactFormInitialState = (params) => ({
  formValues: {
    userData: {
      name: params?.userName,
      email: params?.userEmail,
    },
    contactRecipient: params?.contactRecipient,
    competition: {
      competitionId: params?.competitionId,
      message: params?.message,
    },
    wst: {
      requestId: params?.requestId,
    },
    wrt: {
      queryType: params?.queryType,
      profileDataToChange: params?.profileDataToChange,
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
    getContactFormInitialState(payload.params)
  ),
};

export default function rootReducer(state, action) {
  const reducer = reducers[action.type];
  if (reducer) {
    return reducer(state, action);
  }
  return state;
}
