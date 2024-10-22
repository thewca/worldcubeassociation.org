import {
  ClearForm,
  SetFormRedirection,
  UpdateContactRecipient,
  UpdateSectionData,
  UploadProfileChangeProof,
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
    },
    wst: {
      requestId: params?.requestId,
    },
    wrt: {
      queryType: params?.queryType,
      profileDataToChange: params?.profileDataToChange,
      formRedirection: null,
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

  [UploadProfileChangeProof]: (state, { payload }) => ({
    ...state,
    attachments: [payload.file],
  }),

  [SetFormRedirection]: (state, { payload }) => ({
    ...state,
    formValues: {
      ...state.formValues,
      [payload.section]: {
        ...(state.formValues[payload.section] || {}),
        formRedirection: payload.formRedirection,
      },
    },
  }),
};

export default function rootReducer(state, action) {
  const reducer = reducers[action.type];
  if (reducer) {
    return reducer(state, action);
  }
  return state;
}
