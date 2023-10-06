export const ChangesSaved = 'saving_started';
export const SetErrors = 'set_errors';
export const UpdateFormValue = 'update_form_value';

/**
 * Action creator for marking changes as saved
 * @returns {Action}
 */
export const changesSaved = () => ({
  type: ChangesSaved,
});

export const setErrors = (errors) => ({
  type: SetErrors,
  payload: {
    errors,
  },
});

export const updateFormValue = (key, value, sections = []) => ({
  type: UpdateFormValue,
  payload: {
    key,
    value,
    sections,
  },
});
