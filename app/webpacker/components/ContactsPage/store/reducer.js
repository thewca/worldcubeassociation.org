import {
  UpdateContactRecipient,
  UpdateSubFormCommunicationsTeam,
  UpdateSubFormCompetition,
  UpdateSubFormResultsTeam,
  UpdateSubFormSoftwareTeam,
  UpdateUserData,
} from './actions';

const reducers = {
  [UpdateUserData]: (state, { payload }) => ({
    ...state,
    userData: {
      ...state.userData,
      [payload.name]: payload.value,
    },
  }),

  [UpdateContactRecipient]: (state, { payload }) => ({
    ...state,
    contactRecipient: payload.contactRecipient,
  }),

  [UpdateSubFormCompetition]: (state, { payload }) => ({
    ...state,
    competition: {
      ...state.competition,
      [payload.name]: payload.value,
    },
  }),

  [UpdateSubFormCommunicationsTeam]: (state, { payload }) => ({
    ...state,
    communications_team: {
      ...state.communications_team,
      [payload.name]: payload.value,
    },
  }),

  [UpdateSubFormResultsTeam]: (state, { payload }) => ({
    ...state,
    results_team: {
      ...state.results_team,
      [payload.name]: payload.value,
    },
  }),

  [UpdateSubFormSoftwareTeam]: (state, { payload }) => ({
    ...state,
    software_team: {
      ...state.software_team,
      [payload.name]: payload.value,
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
