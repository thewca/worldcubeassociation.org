import React from 'react';
import {
  Form, FormField, FormGroup, Radio,
} from 'semantic-ui-react';
import { useDispatch, useStore } from '../../../../lib/providers/StoreProvider';
import { updateSectionData } from '../../store/actions';
import I18n from '../../../../lib/i18n';

const SECTION = 'wrt';
const PROFILE_DATA_FIELDS = ['name', 'country', 'gender', 'dob'];

export default function EditProfileQuery() {
  const {
    formValues: {
      wrt: { profileDataToChange, newProfileData, editProfileReason },
    },
  } = useStore();
  const dispatch = useDispatch();
  const handleFormChange = (_, { name, value }) => dispatch(
    updateSectionData(SECTION, name, value),
  );

  return (
    <>
      <FormGroup grouped>
        <div>{I18n.t('page.contacts.form.wrt.profile_data_to_change.label')}</div>
        {PROFILE_DATA_FIELDS.map((profileDataField) => (
          <FormField key={profileDataField}>
            <Radio
              label={I18n.t(`page.contacts.form.wrt.profile_data_to_change.options.${profileDataField}`)}
              name="profileDataToChange"
              value={profileDataField}
              checked={profileDataToChange === profileDataField}
              onChange={handleFormChange}
            />
          </FormField>
        ))}
      </FormGroup>
      {profileDataToChange && (
        <>
          <Form.Input
            label={I18n.t(`page.contacts.form.wrt.new_profile_data_${profileDataToChange}.label`)}
            name="newProfileData"
            value={newProfileData}
            onChange={handleFormChange}
          />
          <Form.TextArea
            label={I18n.t('page.contacts.form.wrt.edit_profile_reason.label')}
            name="editProfileReason"
            value={editProfileReason}
            onChange={handleFormChange}
          />
        </>
      )}
    </>
  );
}
