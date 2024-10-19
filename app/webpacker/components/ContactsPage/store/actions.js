export const UpdateSectionData = 'UPDATE_SECTION_DATA';
export const UpdateContactRecipient = 'UPDATE_CONTACT_RECIPIENT';
export const ClearForm = 'CLEAR_FORM';
export const UploadProfileChangeProof = 'UPLOAD_PROFILE_CHANGE_PROOF';
export const SetFormRedirection = 'SET_FORM_REDIRECTION';

export const updateSectionData = (section, name, value) => ({
  type: UpdateSectionData,
  payload: { section, name, value },
});

export const updateContactRecipient = (contactRecipient) => ({
  type: UpdateContactRecipient,
  payload: { contactRecipient },
});

export const clearForm = (params) => ({
  type: ClearForm,
  payload: { params },
});

export const uploadProfileChangeProof = (file) => ({
  type: UploadProfileChangeProof,
  payload: { file },
});

export const setFormRedirection = (section, formRedirection) => ({
  type: SetFormRedirection,
  payload: { section, formRedirection },
});
