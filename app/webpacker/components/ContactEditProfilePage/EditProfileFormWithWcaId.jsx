import React, { useState } from 'react';
import { Form, Message } from 'semantic-ui-react';
import ReCAPTCHA from 'react-google-recaptcha';
import i18n from '../../lib/i18n';
import { IdWcaSearch } from '../SearchWidget/WcaSearch';
import SEARCH_MODELS from '../SearchWidget/SearchModel';
import EditProfileForm from './EditProfileForm';
import { contactEditProfileActionUrl } from '../../lib/requests/routes.js.erb';
import Loading from '../Requests/Loading';
import Errored from '../Requests/Errored';
import useSaveAction from '../../lib/hooks/useSaveAction';

export default function EditProfileFormWithWcaId({
  wcaId: loggedInUserWcaId,
  loggedInUserData,
  setContactSuccess,
  recaptchaPublicKey,
}) {
  const [contactEmail, setContactEmail] = useState();
  const [customWcaId, setCustomWcaId] = useState();
  const [editProfileReason, setEditProfileReason] = useState();
  const [editedProfileDetails, setEditedProfileDetails] = useState();
  const [profileDetailsChanged, setProfileDetailsChanged] = useState(false);
  const [proof, setProof] = useState();
  const [captchaValue, setCaptchaValue] = useState();
  const [captchaError, setCaptchaError] = useState(false);
  const [saveError, setSaveError] = useState();
  const { save, saving } = useSaveAction();
  const wcaId = loggedInUserWcaId || customWcaId;

  const formSubmitHandler = () => {
    const formData = new FormData();
    formData.append('formValues', JSON.stringify({
      editedProfileDetails, editProfileReason, wcaId, contactEmail,
    }));
    formData.append('attachment', proof);
    save(
      contactEditProfileActionUrl,
      formData,
      () => setContactSuccess(true),
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

  if (saving) return <Loading />;
  if (saveError) return <Errored />;

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
          <EditProfileForm
            wcaId={wcaId}
            setProfileDetailsChanged={setProfileDetailsChanged}
            editedProfileDetails={editedProfileDetails}
            setEditedProfileDetails={setEditedProfileDetails}
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
        disabled={!profileDetailsChanged || !captchaValue}
      >
        {i18n.t('page.contact_edit_profile.form.submit_edit_request_button.label')}
      </Form.Button>
    </Form>
  );
}
