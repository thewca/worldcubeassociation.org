export const UpdateUserData = 'UPDATE_USER_DATA';
export const UpdateContactRecipient = 'UPDATE_CONTACT_RECIPIENT';
export const UpdateSubFormCompetition = 'UPDATE_SUB_FORM_COMPETITION';
export const UpdateSubFormCommunicationsTeam = 'UPDATE_SUB_FORM_COMMUNICATIONS_TEAM';
export const UpdateSubFormResultsTeam = 'UPDATE_SUB_FORM_RESULTS_TEAM';
export const UpdateSubFormSoftwareTeam = 'UPDATE_SUB_FORM_SOFTWARE_TEAM';

export const updateUserData = (name, value) => ({
  type: UpdateUserData,
  payload: { name, value },
});

export const updateContactRecipient = (contactRecipient) => ({
  type: UpdateContactRecipient,
  payload: { contactRecipient },
});

export const updateSubFormCompetition = (name, value) => ({
  type: UpdateSubFormCompetition,
  payload: { name, value },
});

export const updateSubFormCommunicationsTeam = (name, value) => ({
  type: UpdateSubFormCommunicationsTeam,
  payload: { name, value },
});

export const updateSubFormResultsTeam = (name, value) => ({
  type: UpdateSubFormResultsTeam,
  payload: { name, value },
});

export const updateSubFormSoftwareTeam = (name, value) => ({
  type: UpdateSubFormSoftwareTeam,
  payload: { name, value },
});
