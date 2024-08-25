import React, { useEffect, useState } from 'react';
import { Form, Message } from 'semantic-ui-react';
import ReCAPTCHA from 'react-google-recaptcha';
import { QueryClient, useQuery } from '@tanstack/react-query';
import i18n from '../../lib/i18n';
import { IdWcaSearch } from '../SearchWidget/WcaSearch';
import SEARCH_MODELS from '../SearchWidget/SearchModel';
import { apiV0Urls, contactEditProfileActionUrl } from '../../lib/requests/routes.js.erb';
import { genders, countries } from '../../lib/wca-data.js.erb';
import Loading from '../Requests/Loading';
import Errored from '../Requests/Errored';
import useSaveAction from '../../lib/hooks/useSaveAction';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import UtcDatePicker from '../wca/UtcDatePicker';

const CONTACT_EDIT_PROFILE_FORM_QUERY_CLIENT = new QueryClient();

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

export default function EditProfileForm({
  wcaId: loggedInUserWcaId,
  loggedInUserData,
  onContactSuccess,
  recaptchaPublicKey,
}) {
  const [contactEmail, setContactEmail] = useState();
  const [customWcaId, setCustomWcaId] = useState();
  const [editProfileReason, setEditProfileReason] = useState();
  const [editedProfileDetails, setEditedProfileDetails] = useState();
  const [proof, setProof] = useState();
  const [captchaValue, setCaptchaValue] = useState();
  const [captchaError, setCaptchaError] = useState(false);
  const [saveError, setSaveError] = useState();
  const { save, saving } = useSaveAction();
  const wcaId = loggedInUserWcaId || customWcaId;
  const { data, isLoading, isError } = useQuery({
    queryKey: ['profileData'],
    queryFn: () => fetchJsonOrError(apiV0Urls.persons.show(wcaId)),
  }, CONTACT_EDIT_PROFILE_FORM_QUERY_CLIENT);
  const profileDetails = data?.data?.person;

  useEffect(() => {
    setEditedProfileDetails(profileDetails);
  }, [profileDetails]);

  const formSubmitHandler = () => {
    const formData = new FormData();
    formData.append('formValues', JSON.stringify({
      editedProfileDetails, editProfileReason, wcaId, contactEmail,
    }));
    formData.append('attachment', proof);
    save(
      contactEditProfileActionUrl,
      formData,
      onContactSuccess,
      { method: 'POST', headers: {}, body: formData },
      setSaveError,
    );
  };

  const handleEditProfileReaconChange = (e, { value }) => {
    setEditProfileReason(value);
  };

  const handleProofUpload = (event) => {
    setProof(event.target.files[0]);
  };

  const handleFormChange = (e, { name: formName, value }) => {
    setEditedProfileDetails((prev) => ({ ...prev, [formName]: value }));
  };

  if (saving || isLoading) return <Loading />;
  if (saveError || isError) return <Errored />;

  return (
    <Form onSubmit={formSubmitHandler}>
      {!loggedInUserData && (
        <Form.Input
          label={i18n.t('page.contact_edit_profile.form.contact_email.label')}
          value={contactEmail}
          onChange={(e, { value }) => setContactEmail(value)}
          required
        />
      )}
      {!loggedInUserWcaId && (
        <Form.Field
          control={IdWcaSearch}
          name="wcaId"
          label={i18n.t('page.contact_edit_profile.form.wca_id.label')}
          value={customWcaId}
          onChange={(e, { value }) => setCustomWcaId(value)}
          disabled={customWcaId}
          multiple={false}
          model={SEARCH_MODELS.person}
          required
        />
      )}
      {wcaId && (
        <>
          <Form.Input
            label={i18n.t('activerecord.attributes.user.name')}
            name="name"
            value={editedProfileDetails?.name}
            onChange={handleFormChange}
          />
          <Form.Select
            options={countryOptions}
            label={i18n.t('activerecord.attributes.user.country_iso2')}
            name="country_iso2"
            search
            value={editedProfileDetails?.country_iso2}
            onChange={handleFormChange}
          />
          <Form.Select
            options={genderOptions}
            label={i18n.t('activerecord.attributes.user.gender')}
            name="gender"
            value={editedProfileDetails?.gender}
            onChange={handleFormChange}
          />
          <Form.Field
            label={i18n.t('activerecord.attributes.user.dob')}
            name="dob"
            control={UtcDatePicker}
            showYearDropdown
            dateFormatOverride="YYYY-MM-dd"
            dropdownMode="select"
            isoDate={editedProfileDetails?.dob}
            onChange={(date) => handleFormChange(null, {
              name: 'dob',
              value: date,
            })}
          />
          <Form.TextArea
            label={i18n.t('page.contact_edit_profile.form.edit_reason.label')}
            name="editProfileReason"
            required
            value={editProfileReason}
            onChange={handleEditProfileReaconChange}
          />
          <Form.Input
            label={i18n.t('page.contact_edit_profile.form.proof_attach.label')}
            type="file"
            onChange={handleProofUpload}
          />
        </>
      )}
      <Form.Field>
        <ReCAPTCHA
          sitekey={recaptchaPublicKey}
          // onChange is a mandatory parameter for ReCAPTCHA. According to the documentation, this
          // is called when user successfully completes the captcha, hence we are assuming that any
          // existing errors will be cleared when onChange is called.
          onChange={setCaptchaValue}
          onErrored={setCaptchaError}
        />
        {captchaError && (
          <Message
            error
            content={i18n.t('page.contact_edit_profile.form.captcha.validation_error')}
          />
        )}
      </Form.Field>
      <Form.Button
        type="submit"
        disabled={
          !editedProfileDetails || _.isEqual(editedProfileDetails, profileDetails) || !captchaValue
        }
      >
        {i18n.t('page.contact_edit_profile.form.submit_edit_request_button.label')}
      </Form.Button>
    </Form>
  );
}
