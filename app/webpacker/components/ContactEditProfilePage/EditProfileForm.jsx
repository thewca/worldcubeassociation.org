import React, { useEffect, useMemo, useState } from 'react';
import { Form, Message } from 'semantic-ui-react';
import ReCAPTCHA from 'react-google-recaptcha';
import { QueryClient, useQuery } from '@tanstack/react-query';
import _ from 'lodash';
import I18n from '../../lib/i18n';
import { apiV0Urls, contactEditProfileActionUrl } from '../../lib/requests/routes.js.erb';
import Loading from '../Requests/Loading';
import Errored from '../Requests/Errored';
import useSaveAction from '../../lib/hooks/useSaveAction';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import UtcDatePicker from '../wca/UtcDatePicker';
import RegionSelector from '../wca/RegionSelector';
import GenderSelector from '../wca/GenderSelector';
import { GENERATIONAL_SUFFIXES } from '../../lib/wca-data.js.erb';

const CONTACT_EDIT_PROFILE_FORM_QUERY_CLIENT = new QueryClient();

const extractRomanName = (personName) => {
  const match = personName.match(/(.*)\((.*)\)$/);
  const romanName = match ? match[1] : personName;
  return romanName.trim();
};

export const extractLastNameWithSuffix = (personName) => {
  if (!personName) return '';
  const romanName = extractRomanName(personName);
  const nameParts = romanName.split(/\s+/).filter(Boolean);

  if (nameParts.length === 0) return '';

  const lastPart = nameParts[nameParts.length - 1];
  if (nameParts.length > 1 && GENERATIONAL_SUFFIXES.includes(lastPart.toUpperCase())) {
    return `${nameParts[nameParts.length - 2]} ${lastPart}`;
  }
  return lastPart;
};

export default function EditProfileForm({
  wcaId,
  onContactSuccess,
  recaptchaPublicKey,
  editOthersProfileMode,
}) {
  const [editProfileReason, setEditProfileReason] = useState();
  const [editedProfileDetails, setEditedProfileDetails] = useState();
  const [proofAttachment, setProofAttachment] = useState();
  const [captchaValue, setCaptchaValue] = useState();
  const [captchaError, setCaptchaError] = useState(false);
  const [saveError, setSaveError] = useState();
  const { save, saving } = useSaveAction();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['profileData'],
    queryFn: () => fetchJsonOrError(apiV0Urls.persons.show(wcaId)),
  }, CONTACT_EDIT_PROFILE_FORM_QUERY_CLIENT);

  const profileDetails = data?.data?.person;

  const isSubmitDisabled = useMemo(
    () => !editedProfileDetails || _.isEqual(editedProfileDetails, profileDetails) || !captchaValue,
    [captchaValue, editedProfileDetails, profileDetails],
  );

  const proofAttachmentRequired = useMemo(() => {
    if (!editedProfileDetails || !profileDetails) return false;

    // Country and DOB changes always require proof.
    if (editedProfileDetails.country_iso2 !== profileDetails.country_iso2) return true;
    if (editedProfileDetails.dob !== profileDetails.dob) return true;

    // Gender changes (and accompanying name changes) are considered sensitive,
    // hence proof is optional.
    if (editedProfileDetails.gender !== profileDetails.gender) return false;

    // Otherwise, check if the last name (including generational suffix) changed.
    return extractLastNameWithSuffix(editedProfileDetails.name)
      !== extractLastNameWithSuffix(profileDetails.name);
  }, [editedProfileDetails, profileDetails]);

  useEffect(() => {
    setEditedProfileDetails(profileDetails);
  }, [profileDetails]);

  const formSubmitHandler = () => {
    const formData = new FormData();

    formData.append('formValues', JSON.stringify({
      editedProfileDetails, editProfileReason, wcaId,
    }));
    if (proofAttachment) {
      formData.append('attachment', proofAttachment);
    }

    save(
      contactEditProfileActionUrl,
      formData,
      onContactSuccess,
      { method: 'POST', headers: {}, body: formData },
      setSaveError,
    );
  };

  const handleEditProfileReasonChange = (e, { value }) => {
    setEditProfileReason(value);
  };

  const handleProofUpload = (event) => {
    setProofAttachment(event.target.files[0]);
  };

  const handleFormChange = (e, { name: formName, value }) => {
    setEditedProfileDetails((prev) => ({ ...prev, [formName]: value }));
  };

  const handleDobChange = (date) => handleFormChange(null, {
    name: 'dob',
    value: date,
  });

  if (saving || isLoading) return <Loading />;
  if (saveError || isError) return <Errored />;

  return (
    <Form onSubmit={formSubmitHandler}>
      <Form.Input
        label={I18n.t('activerecord.attributes.user.name')}
        name="name"
        value={editedProfileDetails?.name}
        onChange={handleFormChange}
        required
      />
      <RegionSelector
        label={I18n.t('activerecord.attributes.user.country_iso2')}
        name="country_iso2"
        onlyCountries
        region={editedProfileDetails?.country_iso2}
        onRegionChange={handleFormChange}
      />
      <GenderSelector
        name="gender"
        gender={editedProfileDetails?.gender}
        onChange={handleFormChange}
      />
      <Form.Field
        label={I18n.t('activerecord.attributes.user.dob')}
        name="dob"
        control={UtcDatePicker}
        showYearDropdown
        dateFormatOverride="yyyy-MM-dd"
        dropdownMode="select"
        isoDate={editedProfileDetails?.dob}
        onChange={handleDobChange}
        required
      />
      <Form.TextArea
        label={I18n.t('page.contact_edit_profile.form.edit_reason.label')}
        name="editProfileReason"
        required
        value={editProfileReason}
        onChange={handleEditProfileReasonChange}
      />
      <Form.Input
        label={I18n.t('page.contact_edit_profile.form.proof_attach.label')}
        type="file"
        onChange={handleProofUpload}
        required={proofAttachmentRequired && !editOthersProfileMode}
      />
      <p className="help-block">
        <span className="text-danger">IMPORTANT</span>
        : Attach a picture of a
        {' '}
        <u>legal document</u>
        {' '}
        (identity card, driver license, passport...) that validates the requested fields;
        {' '}
        feel free to blur-out/obfuscate any other personal data on the identification.
      </p>
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
            content={I18n.t('page.contact_edit_profile.form.captcha.validation_error')}
          />
        )}
      </Form.Field>
      <Form.Button
        type="submit"
        disabled={isSubmitDisabled}
      >
        {I18n.t('page.contact_edit_profile.form.submit_edit_request_button.label')}
      </Form.Button>
    </Form>
  );
}
