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
import { updateContactRecipient } from './store/actions';
import CommunicationsTeam from './SubForms/CommunicationsTeam';
import Competition from './SubForms/Competition';
import ResultsTeam from './SubForms/ResultsTeam';
import SoftwareTeam from './SubForms/SoftwareTeam';

const CONTACT_RECIPIENTS = [
  'competition',
  'communications_team',
  'results_team',
  'software_team',
];

const CONTACT_RECIPIENTS_MAP = _.keyBy(CONTACT_RECIPIENTS, _.camelCase);

export default function ContactForm({ loggedInUserData }) {
  const { save, saving } = useSaveAction();
  const [captchaValue, setCaptchaValue] = useState();
  const [captchaError, setCaptchaError] = useState(false);
  const contactFormState = useStore();
  const dispatch = useDispatch();
  const { contactRecipient: selectedContactRecipient, userData } = contactFormState;

  const isFormValid = (
    selectedContactRecipient && userData.name && userData.email && captchaValue
  );
  const SubForm = useMemo(() => {
    if (!selectedContactRecipient) return null;
    switch (selectedContactRecipient) {
      case CONTACT_RECIPIENTS_MAP.competition:
        return Competition;
      case CONTACT_RECIPIENTS_MAP.communicationsTeam:
        return CommunicationsTeam;
      case CONTACT_RECIPIENTS_MAP.resultsTeam:
        return ResultsTeam;
      case CONTACT_RECIPIENTS_MAP.softwareTeam:
        return SoftwareTeam;
      default:
        return null;
    }
  }, [selectedContactRecipient]);

  if (saving) return <Loading />;

  return (
    <Form
      onSubmit={() => {
        if (isFormValid) {
          save(
            contactUrl,
            contactFormState,
            () => dispatch(updateContactRecipient(null)),
            { method: 'POST' },
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
              onChange={() => dispatch(updateContactRecipient(contactRecipient))}
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
  );
}
