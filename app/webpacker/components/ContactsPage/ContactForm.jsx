import React, { useEffect, useMemo, useState } from 'react';
import {
  Form, FormGroup, FormField, Button, Radio, Message,
} from 'semantic-ui-react';
import ReCAPTCHA from 'react-google-recaptcha';
import _ from 'lodash';
import { contactUrl } from '../../lib/requests/routes.js.erb';
import useInputState from '../../lib/hooks/useInputState';
import useSaveAction from '../../lib/hooks/useSaveAction';
import I18n from '../../lib/i18n';
import { RECAPTCHA_PUBLIC_KEY } from '../../lib/wca-data.js.erb';
import UserData from './SubForms/UserData';
import Loading from '../Requests/Loading';
import Wct from './SubForms/Wct';
import Competition from './SubForms/Competition';

const CONTACT_RECIPIENTS = [
  'competition',
  'communications_team',
  'results_team',
  'software',
];

const CONTACT_RECIPIENTS_MAP = _.keyBy(CONTACT_RECIPIENTS);

const SUBFORM_DEFAULT_VALUE = {
  competition: null,
  message: '',
};

export default function ContactForm({ userDetails }) {
  const [userData, setUserData] = useState({
    name: userDetails?.user?.name || '',
    email: userDetails?.user?.email || '',
  });
  const [selectedContactType, setSelectedContactType] = useInputState(null);
  const [subformValues, setSubformValues] = useState(SUBFORM_DEFAULT_VALUE);

  const { save, saving } = useSaveAction();
  const [captchaValue, setCaptchaValue] = useState();
  const [captchaError, setCaptchaError] = useState(false);

  const isFormValid = (
    selectedContactType && userData.name && userData.email && captchaValue
  );
  const SubForm = useMemo(() => {
    if (!selectedContactType) return null;
    switch (selectedContactType) {
      case CONTACT_RECIPIENTS_MAP.competition:
        return Competition;
      default:
        return Wct;
    }
  }, [selectedContactType]);

  useEffect(() => {
    setSubformValues(SUBFORM_DEFAULT_VALUE);
  }, [selectedContactType]);

  if (saving) return <Loading />;

  return (
    <Form
      onSubmit={() => {
        if (isFormValid) {
          save(
            contactUrl,
            {
              userData,
              contactType: selectedContactType,
              [selectedContactType]: subformValues,
            },
            () => setSelectedContactType(null),
            { method: 'POST' },
          );
        }
      }}
      error={!!captchaError}
    >
      {!userDetails && (
        <UserData
          formValues={userData}
          setFormValues={setUserData}
        />
      )}
      <FormGroup grouped>
        <div>{I18n.t('page.contacts.form.contact_recipient.label')}</div>
        {CONTACT_RECIPIENTS.map((contactType) => (
          <FormField key={contactType}>
            <Radio
              label={I18n.t(`page.contacts.form.contact_recipient.${contactType}.label`)}
              name="contactType"
              value={contactType}
              checked={selectedContactType === contactType}
              onChange={setSelectedContactType}
            />
          </FormField>
        ))}
      </FormGroup>
      {SubForm && (
        <SubForm
          formValues={subformValues}
          setFormValues={setSubformValues}
        />
      )}
      <FormField>
        <ReCAPTCHA
          sitekey={RECAPTCHA_PUBLIC_KEY}
          // onChange is a mandatory parameter for ReCAPTCHA. According to the documentation, this
          // is called when user successfully completes the captcha, hence we are assuming that any
          // existing errors will be cleared when onChange is called.
          onChange={setCaptchaValue}
          onErrored={setCaptchaError}
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
      >
        {I18n.t('page.contacts.form.submit_button')}
      </Button>
    </Form>
  );
}
