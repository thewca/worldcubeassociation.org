export const ChangesSaved = 'saving_started';
export const SetErrors = 'set_errors';

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
