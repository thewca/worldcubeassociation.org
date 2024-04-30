export const UpdateSectionData = 'UPDATE_SECTION_DATA';
export const UpdateContactRecipient = 'UPDATE_CONTACT_RECIPIENT';

export const updateSectionData = (section, name, value) => ({
  type: UpdateSectionData,
  payload: { section, name, value },
});

export const updateContactRecipient = (contactRecipient) => ({
  type: UpdateContactRecipient,
  payload: { contactRecipient },
});
