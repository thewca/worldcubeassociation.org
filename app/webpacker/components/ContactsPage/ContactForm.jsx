import React, { useMemo, useRef, useState } from 'react';
import {
  Form, FormGroup, FormField, Button, Radio, Message,
} from 'semantic-ui-react';
import ReCAPTCHA from 'react-google-recaptcha';
import { contactUrl } from '../../lib/requests/routes.js.erb';
import useInputState from '../../lib/hooks/useInputState';
import useSaveAction from '../../lib/hooks/useSaveAction';
import I18n from '../../lib/i18n';
import { CONTACT_TYPES, RECAPTCHA_PUBLIC_KEY } from '../../lib/wca-data.js.erb';
import UserData from './SubForms/UserData';
import Loading from '../Requests/Loading';
import Wct from './SubForms/Wct';
import Competition from './SubForms/Competition';

export default function ContactForm({ userDetails }) {
  const initialFormValues = useMemo(() => ({
    userData: {
      name: userDetails?.user?.name || '',
      email: userDetails?.user?.email || '',
    },
  }), [userDetails]);
  const [formValues, setFormValues] = useInputState(initialFormValues);
  const { save, saving } = useSaveAction();
  const [captchaError, setCaptchaError] = useState(false);
  const recaptchaRef = useRef();

  const isFormValid = (
    formValues.contactType && formValues.userData.name && formValues.userData.email
  );
  const SubForm = useMemo(() => {
    if (!formValues.contactType) return null;
    switch (formValues.contactType) {
      case CONTACT_TYPES[0]: // competition
        return Competition;
      default:
        return Wct;
    }
  }, [formValues.contactType]);

  const resetForm = () => setFormValues(initialFormValues);

  if (saving) return <Loading />;

  return (
    <Form
      onSubmit={() => {
        save(contactUrl, formValues, resetForm, { method: 'POST' });
      }}
      error={!!captchaError}
    >
      <UserData
        formValues={formValues.userData}
        setFormValues={(userData) => setFormValues({ ...formValues, userData })}
        userDetails={userDetails}
      />
      <FormGroup grouped>
        <div>{I18n.t('page.contacts.form.contact_type.label')}</div>
        {CONTACT_TYPES.map((contactType) => (
          <FormField key={contactType}>
            <Radio
              label={I18n.t(`page.contacts.form.contact_type.${contactType}.label`)}
              name="contactType"
              value={contactType}
              checked={formValues.contactType === contactType}
              style={{
                // This is temporary fix because bootstrap is having a css which makes the margin of
                // this radio as 10px, and the UI looks ugly because of that. This temporary fix
                // can be removed once bootstrap is not there in our UI.
                margin: '1.5px 0px',
              }}
              onChange={(_, { value }) => {
                setFormValues({
                  userData: formValues.userData,
                  contactType: value,
                  [value]: {
                    competition: null,
                    message: '',
                  },
                });
              }}
            />
          </FormField>
        ))}
      </FormGroup>
      {SubForm && (
        <SubForm
          formValues={formValues[formValues.contactType] || {}}
          setFormValues={(subFormData) => setFormValues({
            ...formValues,
            [formValues.contactType]: subFormData,
          })}
        />
      )}
      <FormField>
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={RECAPTCHA_PUBLIC_KEY}
          onChange={() => setCaptchaError(false)}
        />
        {captchaError && (
        <Message
          error
          content={I18n.t('page.contacts.form.captcha.validation_error')}
        />
        )}
      </FormField>
      <Button
        disabled={!isFormValid}
        type="submit"
        onClick={(e) => {
          const captchaValue = recaptchaRef.current.getValue();
          if (!captchaValue) {
            setCaptchaError(true);
            e.preventDefault();
          }
        }}
      >
        {I18n.t('page.contacts.form.submit_button')}
      </Button>
    </Form>
  );
}
