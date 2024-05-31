export const UpdateSectionData = 'UPDATE_SECTION_DATA';
export const UpdateContactRecipient = 'UPDATE_CONTACT_RECIPIENT';
export const ClearForm = 'CLEAR_FORM';

export const updateSectionData = (section, name, value) => ({
  type: UpdateSectionData,
  payload: { section, name, value },
});

export const updateContactRecipient = (contactRecipient) => ({
  type: UpdateContactRecipient,
  payload: { contactRecipient },
});

export const clearForm = (loggedInUserData, queryParams) => ({
  type: ClearForm,
  payload: { loggedInUserData, queryParams },
});
