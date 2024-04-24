import React, { useMemo, useState } from 'react';
import {
  Form, FormGroup, FormField, Button, Radio, Message,
} from 'semantic-ui-react';
import ReCAPTCHA from 'react-google-recaptcha';
import _ from 'lodash';
import { contactUrl } from '../../lib/requests/routes.js.erb';
import useInputState from '../../lib/hooks/useInputState';
import useQueryParams from '../../lib/hooks/useQueryParams';
import useSaveAction from '../../lib/hooks/useSaveAction';
import I18n from '../../lib/i18n';
import { RECAPTCHA_PUBLIC_KEY } from '../../lib/wca-data.js.erb';
import UserData from './UserData';
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

export default function ContactForm({ userDetails }) {
  const [userData, setUserData] = useState({
    name: userDetails?.user?.name || '',
    email: userDetails?.user?.email || '',
  });
  const [queryParams] = useQueryParams();
  const [selectedContactRecipient, setSelectedContactRecipient] = useInputState(
    queryParams?.contactRecipient,
  );
  const [subformValues, setSubformValues] = useState(SUBFORM_DEFAULT_VALUE);
  const [subformValid, setSubformValid] = useState(false);

  const { save, saving } = useSaveAction();
  const [captchaValue, setCaptchaValue] = useState();
  const [captchaError, setCaptchaError] = useState(false);

  const isFormValid = (
    CONTACT_RECIPIENTS_MAP[selectedContactRecipient]
     && userData.name && userData.email && captchaValue && subformValid
  );
  const SubForm = useMemo(() => {
    if (!selectedContactRecipient) return null;
    switch (selectedContactRecipient) {
      case CONTACT_RECIPIENTS_MAP.competition:
        return Competition;
      default:
        return Wct;
    }
  }, [selectedContactRecipient]);

  if (saving) return <Loading />;

  return (
    <Form
      onSubmit={() => {
        if (isFormValid) {
          save(
            contactUrl,
            {
              userData,
              contactRecipient: selectedContactRecipient,
              [selectedContactRecipient]: subformValues,
            },
            () => setSelectedContactRecipient(null),
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
        {CONTACT_RECIPIENTS.map((contactRecipient) => (
          <FormField key={contactRecipient}>
            <Radio
              label={I18n.t(`page.contacts.form.contact_recipient.${contactRecipient}.label`)}
              name="contactRecipient"
              value={contactRecipient}
              checked={selectedContactRecipient === contactRecipient}
              onChange={setSelectedContactRecipient}
            />
          </FormField>
        ))}
      </FormGroup>
      {SubForm && (
        <SubForm
          setSubformValues={setSubformValues}
          setFormValid={setSubformValid}
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
