import { ChangesSaved, SetErrors, UpdateFormValue } from './actions';

const updateValueRecursive = (formValues, key, value, sectionKeys = []) => {
  if (sectionKeys.length === 0) {
    return {
      ...formValues,
      [key]: value,
    };
  }

  const nextSection = sectionKeys.shift();
  const nestedFormValues = formValues[nextSection] || {};

  return {
    ...formValues,
    [nextSection]: updateValueRecursive(nestedFormValues, key, value, sectionKeys),
  };
};

const reducers = {
  [ChangesSaved]: (state) => ({
    ...state,
    initialCompetition: state.competition,
  }),

  [SetErrors]: (state, { payload }) => ({
    ...state,
    errors: payload.errors,
  }),

  [UpdateFormValue]: (state, { payload }) => ({
    ...state,
    competition: updateValueRecursive(
      state.competition,
      payload.key,
      payload.value,
      // This might look useless but we're doing a (shallow) copy on purpose
      // to avoid accidentally mutating state during recursion
      [...payload.sections],
    ),
  }),
};

export default function rootReducer(state, action) {
  const reducer = reducers[action.type];
  if (reducer) {
    return reducer(state, action);
  }
  return state;
}
