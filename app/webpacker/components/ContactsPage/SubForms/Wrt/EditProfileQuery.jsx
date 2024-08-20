import React from 'react';
import {
  Form, FormField, FormGroup, Radio,
} from 'semantic-ui-react';
import { useDispatch, useStore } from '../../../../lib/providers/StoreProvider';
import { updateSectionData, clearForm, uploadProfileChangeProof } from '../../store/actions';
import I18n from '../../../../lib/i18n';
import UtcDatePicker from '../../../wca/UtcDatePicker';
import { genders, countries } from '../../../../lib/wca-data.js.erb';

const SECTION = 'wrt';
const PROFILE_DATA_FIELDS = ['name', 'country', 'gender', 'dob'];

const genderOptions = _.map(genders.byId, (gender) => ({
  key: gender.id,
  text: gender.name,
  value: gender.id,
}));

const countryOptions = _.map(countries.byIso2, (country) => ({
  key: country.iso2,
  text: country.name,
  value: country.iso2,
}));

export default function EditProfileQuery() {
  const {
    formValues: {
      userData: { name: userName, email: userEmail },
      contactRecipient,
      wrt: { profileDataToChange, newProfileData, editProfileReason },
    },
  } = useStore();
  const dispatch = useDispatch();
  const handleFormChange = (_, { name, value }) => dispatch(
    updateSectionData(SECTION, name, value),
  );

  const handleProfileDataFieldChange = (_, { value }) => dispatch(
    clearForm({
      userName,
      userEmail,
      contactRecipient,
      queryType: 'edit_profile',
      profileDataToChange: value,
    }),
  );

  const handleFileUpload = (event) => dispatch(
    uploadProfileChangeProof(event.target.files[0]),
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
              onChange={handleProfileDataFieldChange}
            />
          </FormField>
        ))}
      </FormGroup>
      {profileDataToChange && (
        <>
          {profileDataToChange === 'name' && (
            <Form.Input
              label={I18n.t('page.contacts.form.wrt.new_profile_data_name.label')}
              name="newProfileData"
              value={newProfileData}
              onChange={handleFormChange}
            />
          )}
          {profileDataToChange === 'country' && (
            <Form.Select
              label={I18n.t('page.contacts.form.wrt.new_profile_data_country.label')}
              options={countryOptions}
              name="newProfileData"
              search
              value={newProfileData}
              onChange={handleFormChange}
            />
          )}
          {profileDataToChange === 'gender' && (
            <Form.Select
              label={I18n.t('page.contacts.form.wrt.new_profile_data_gender.label')}
              options={genderOptions}
              name="newProfileData"
              value={newProfileData}
              onChange={handleFormChange}
            />
          )}
          {profileDataToChange === 'dob' && (
            <Form.Field
              label={I18n.t('page.contacts.form.wrt.new_profile_data_dob.label')}
              name="newProfileData"
              control={UtcDatePicker}
              showYearDropdown
              dateFormatOverride="YYYY-MM-dd"
              dropdownMode="select"
              isoDate={newProfileData}
              onChange={(date) => handleFormChange(null, {
                name: 'newProfileData',
                value: date,
              })}
            />
          )}
          <Form.TextArea
            label={I18n.t('page.contacts.form.wrt.edit_profile_reason.label')}
            name="editProfileReason"
            value={editProfileReason}
            onChange={handleFormChange}
          />
          <Form.Input
            label={I18n.t('page.contacts.form.wrt.edit_profile_proof_attach.label')}
            type="file"
            onChange={handleFileUpload}
          />
        </>
      )}
    </>
  );
}
