import React, { useMemo, useState, useCallback } from 'react';
import { Form, Message } from 'semantic-ui-react';
import ReCAPTCHA from 'react-google-recaptcha';
import _ from 'lodash';
import I18n from '../../lib/i18n';
import { contactEditProfileActionUrl } from '../../lib/requests/routes.js.erb';
import Loading from '../../components/Requests/Loading';
import useSaveAction from '../../lib/hooks/useSaveAction';
import useCheckboxState from '../../lib/hooks/useCheckboxState';
import useLoggedInUserPermissions from '../../lib/hooks/useLoggedInUserPermissions';
import EditNameField from './fields/EditNameField';
import EditRegionField from './fields/EditRegionField';
import EditGenderField from './fields/EditGenderField';
import EditDobField from './fields/EditDobField';

const EDITABLE_FIELDS = [
  { name: 'name', Component: EditNameField },
  { name: 'country_iso2', Component: EditRegionField },
  { name: 'gender', Component: EditGenderField },
  { name: 'dob', Component: EditDobField },
];

export default function EditProfileForm({
  wcaId,
  editOthersProfileMode,
  profileDetails,
  onContactSuccess,
  recaptchaPublicKey,
}) {
  const [editedProfileDetails, setEditedProfileDetails] = useState(() => _.fromPairs(
    EDITABLE_FIELDS.map(({ name }) => [
      name,
      { newValue: profileDetails?.[name] || '', editReason: '' },
    ]),
  ));
  const [proofAttachment, setProofAttachment] = useState();
  const [captchaValue, setCaptchaValue] = useState();
  const [captchaError, setCaptchaError] = useState(false);
  const [saveError, setSaveError] = useState();
  const [verified, setVerified] = useCheckboxState(false);
  const { save, saving } = useSaveAction();
  const { loggedInUserPermissions } = useLoggedInUserPermissions();

  const isProofOptional = loggedInUserPermissions?.canRequestToEditOthersProfile;

  const hasFieldBeenChanged = useCallback((field) => !_.isEqual(
    profileDetails?.[field],
    editedProfileDetails[field].newValue,
  ), [profileDetails, editedProfileDetails]);

  const isSubmitDisabled = useMemo(() => {
    if (!profileDetails || !captchaValue) return true;
    if (editOthersProfileMode && !verified) return true;

    const changedFields = Object.keys(editedProfileDetails).filter(hasFieldBeenChanged);

    const noChanges = changedFields.length === 0;
    const hasMissingReason = changedFields.some(
      (field) => !editedProfileDetails[field].editReason.trim(),
    );

    return noChanges || hasMissingReason;
  }, [
    captchaValue,
    editOthersProfileMode,
    verified,
    editedProfileDetails,
    hasFieldBeenChanged,
    profileDetails,
  ]);

  const handleValueChange = (_event, { name, value }) => {
    setEditedProfileDetails((prev) => ({
      ...prev,
      [name]: { ...prev[name], newValue: value },
    }));
  };

  const handleEditReasonChange = (_event, { name, value }) => {
    setEditedProfileDetails((prev) => ({
      ...prev,
      [name]: { ...prev[name], editReason: value },
    }));
  };

  const formSubmitHandler = () => {
    const formData = new FormData();

    formData.append('formValues', JSON.stringify({
      editedProfileDetails, wcaId,
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

  const handleProofUpload = (event) => {
    setProofAttachment(event.target.files[0]);
  };

  if (saving) return <Loading />;

  return (
    <Form onSubmit={formSubmitHandler} error={!!saveError} warning>
      {saveError && (
        <Message
          error
          content={saveError.json?.error || 'Something went wrong.'}
        />
      )}
      {EDITABLE_FIELDS.map(({ name, Component }) => (
        <Component
          key={name}
          value={editedProfileDetails[name].newValue}
          reason={editedProfileDetails[name].editReason}
          isChanged={hasFieldBeenChanged(name)}
          onValueChange={handleValueChange}
          onReasonChange={handleEditReasonChange}
        />
      ))}
      <Message warning>
        <Message.Header>IMPORTANT</Message.Header>
        {isProofOptional && (
          <p>
            <strong>
              Note: Since you are an authorized user, attaching proof is optional for you. However,
              the following are the usual requirements that you need to validate:
            </strong>
          </p>
        )}
        <Message.List>
          <Message.Item>
            Proof is not required when you change your first name or gender.
          </Message.Item>
          <Message.Item>
            If you are changing your last name, region of representation, or birthdate, please
            upload a
            {' '}
            <u>legal document</u>
            {' '}
            (e.g., identity card, driver&apos;s licence, passport, marriage certificate, etc.)
            {' '}
            that validates the requested field. Feel free to blur-out/obfuscate any other
            {' '}
            personal data on the identification.
          </Message.Item>
        </Message.List>
      </Message>
      <Form.Input
        label={`${I18n.t('page.contact_edit_profile.form.proof_attach.label')}${isProofOptional ? ' (optional for authorized users)' : ''}`}
        type="file"
        onChange={handleProofUpload}
      />
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
      {editOthersProfileMode && (
        <Form.Checkbox
          label={I18n.t('page.contact_edit_profile.form.verified_checkbox.label')}
          checked={verified}
          onChange={setVerified}
        />
      )}
      <Form.Button
        type="submit"
        disabled={isSubmitDisabled}
      >
        {I18n.t('page.contact_edit_profile.form.submit_edit_request_button.label')}
      </Form.Button>
    </Form>
  );
}
