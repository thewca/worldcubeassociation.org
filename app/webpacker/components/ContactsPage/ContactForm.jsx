import React, { useMemo, useState } from 'react';
import {
  Form, FormGroup, FormField, Button, Radio, Message,
} from 'semantic-ui-react';
import ReCAPTCHA from 'react-google-recaptcha';
import _ from 'lodash';
import { contactUrl } from '../../lib/requests/routes.js.erb';
import useSaveAction from '../../lib/hooks/useSaveAction';
import I18n from '../../lib/i18n';
import { RECAPTCHA_PUBLIC_KEY } from '../../lib/wca-data.js.erb';
import UserData from './UserData';
import Loading from '../Requests/Loading';
import { useDispatch, useStore } from '../../lib/providers/StoreProvider';
import { clearForm, updateContactRecipient } from './store/actions';
import Wct from './SubForms/Wct';
import Wrt from './SubForms/Wrt';
import Wst from './SubForms/Wst';
import Competition from './SubForms/Competition';

const CONTACT_RECIPIENTS = [
  'competition',
  'wct',
  'wrt',
  'wst',
];

const CONTACT_RECIPIENTS_MAP = _.keyBy(CONTACT_RECIPIENTS, _.camelCase);

export default function ContactForm({ loggedInUserData }) {
  const { save, saving } = useSaveAction();
  const [captchaValue, setCaptchaValue] = useState();
  const [captchaError, setCaptchaError] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const contactFormState = useStore();
  const dispatch = useDispatch();
  const { formValues: { contactRecipient: selectedContactRecipient, userData } } = contactFormState;

  const isFormValid = (
    selectedContactRecipient && userData.name && userData.email && captchaValue
  );

  const contactSuccessHandler = () => {
    dispatch(clearForm(loggedInUserData));
    setContactSuccess(true);
  };

  const recipientChangeHandler = (__, { value }) => {
    setContactSuccess(false);
    dispatch(updateContactRecipient(value));
  };

  const SubForm = useMemo(() => {
    if (!selectedContactRecipient) return null;
    switch (selectedContactRecipient) {
      case CONTACT_RECIPIENTS_MAP.competition:
        return Competition;
      case CONTACT_RECIPIENTS_MAP.wct:
        return Wct;
      case CONTACT_RECIPIENTS_MAP.wrt:
        return Wrt;
      case CONTACT_RECIPIENTS_MAP.wst:
        return Wst;
      default:
        return null;
    }
  }, [selectedContactRecipient]);

  if (saving) return <Loading />;

  return (
    <>
      {contactSuccess && (
        <Message
          success
          content={I18n.t('page.contacts.success_message')}
        />
      )}
      <Form
        onSubmit={() => {
          if (isFormValid) {
            const formData = new FormData();
            formData.append('formValues', JSON.stringify(contactFormState.formValues));
            save(
              contactUrl,
              formData,
              contactSuccessHandler,
              { method: 'POST', headers: {}, body: formData },
            );
          }
        }}
        error={!!captchaError}
      >
        <UserData loggedInUserData={loggedInUserData} />
        <FormGroup grouped>
          <div>{I18n.t('page.contacts.form.contact_recipient.label')}</div>
          {CONTACT_RECIPIENTS.map((contactRecipient) => (
            <FormField key={contactRecipient}>
              <Radio
                label={I18n.t(`page.contacts.form.contact_recipient.${contactRecipient}.label`)}
                name="contactRecipient"
                value={contactRecipient}
                checked={selectedContactRecipient === contactRecipient}
                onChange={recipientChangeHandler}
              />
            </FormField>
          ))}
        </FormGroup>
        {SubForm && <SubForm />}
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
    </>
  );
}
