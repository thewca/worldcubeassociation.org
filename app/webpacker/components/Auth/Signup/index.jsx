import React, { useRef, useState } from 'react';
import {
  Button, Card, CardHeader, Container, Form, FormField, Message,
} from 'semantic-ui-react';
import ReCAPTCHA from 'react-google-recaptcha';
import { RECAPTCHA_PUBLIC_KEY } from '../../../lib/wca-data.js.erb';
import I18n from '../../../lib/i18n';
import { emailRegex } from '../../../lib/helpers/regex';
import ClaimWcaIdWithReactQuery from './ClaimWcaId';
import I18nHTMLTranslate from '../../I18nHTMLTranslate';

const COMPETITOR_STATE = {
  NONE: 'none',
  NEW: 'new',
  RETURNER: 'returner',
};

export default function Signup() {
  // hasClickedSignUpButton is a minor hack to prevent fomantic CSS messing up the UI.
  const [hasClickedSignUpButton, setHasClickedSignUpButton] = useState(false);
  const [formValues, setFormValues] = useState({
    email: {
      error: null,
      id: 'email',
      value: '',
    },
    password: {
      error: null,
      id: 'password',
      value: '',
    },
    confirmPassword: {
      error: null,
      id: 'confirmPassword',
      value: '',
    },
    unconfirmedWcaId: {
      error: null,
      id: 'unconfirmedWcaId',
      value: '',
    },
    name: {
      error: null,
      id: 'name',
      value: '',
    },
    dob: {
      error: null,
      id: 'dob',
      value: '',
    },
    gender: {
      error: null,
      id: 'gender',
      value: '',
    },
    countryIso2: {
      error: null,
      id: 'countryIso2',
      value: '',
    },
  });
  const [captchaError, setCaptchaError] = useState(false);
  const [competitorState, setCompetitorState] = useState(COMPETITOR_STATE.NONE);
  const recaptchaRef = useRef();
  const csrfToken = document.querySelector('meta[name=csrf-token]')?.content;

  const setFormError = (id, error) => {
    setFormValues({
      ...formValues,
      [id]: {
        ...formValues[id],
        error,
      },
    });
  };

  const validation = {
    email: () => {
      if (!emailRegex.test(formValues.email.value)) {
        setFormError(formValues.email.id, I18n.t('page.sign_up.form.email.validation_error'));
        return false;
      }
      setFormError(formValues.email.id, null);
      return true;
    },
    password: () => {
      const minimumPasswordLength = 3;
      if (formValues.password.value.length < minimumPasswordLength) {
        setFormError(formValues.password.id, I18n.t('page.sign_up.form.password.validation_error'));
        return false;
      }
      setFormError(formValues.password.id, null);
      return true;
    },
    confirmPassword: () => {
      if (formValues.password.value !== formValues.confirmPassword.value) {
        setFormError(formValues.confirmPassword.id, I18n.t('page.sign_up.form.confirm_password.validation_error'));
        return false;
      }
      setFormError(formValues.confirmPassword.id, null);
      return true;
    },
    name: () => true, // FIXME: Add validation if required.
    dob: () => true, // FIXME: Add validation if required.
    gender: () => true, // FIXME: Add validation if required.
    countryIso2: () => true, // FIXME: Add validation if required.
  };

  const handleFormChange = (_, { id, value }) => setFormValues({
    ...formValues,
    [id]: {
      ...formValues[id],
      error: null,
      value,
    },
  });

  return (
    <Container>
      <Card fluid>
        <Card.Content>
          <CardHeader>{I18n.t('page.sign_up.title')}</CardHeader>
        </Card.Content>
        <Card.Content>
          <Form
            method="post"
            action="/users"
            className={hasClickedSignUpButton ? '' : 'initial'}
            error={!!captchaError}
          >
            <Form.Input
              name="authenticity_token"
              style={{ display: 'none' }}
              value={csrfToken}
            />
            <Form.Input
              error={formValues.email.error}
              id={formValues.email.id}
              label={I18n.t('activerecord.attributes.user.email')}
              name="user[email]"
              onBlur={validation.email}
              onChange={handleFormChange}
              required
              type="text"
              value={formValues.email.value}
            />
            <Form.Input
              autoComplete="new-password" // To force chrome or other browsers not to suggest existing password, instead suggest new password.
              error={formValues.password.error}
              id={formValues.password.id}
              label={I18n.t('activerecord.attributes.user.password')}
              name="user[password]"
              onBlur={validation.password}
              onChange={handleFormChange}
              required
              type="password"
              value={formValues.password.value}
            />
            <Form.Input
              error={formValues.confirmPassword.error}
              id={formValues.confirmPassword.id}
              label={I18n.t('activerecord.attributes.user.password_confirmation')}
              name="user[password_confirmation]"
              onBlur={validation.confirmPassword}
              onChange={handleFormChange}
              required
              type="password"
              value={formValues.confirmPassword.value}
            />
            <Form.Select
              id="competitor_state"
              label={I18n.t('page.sign_up.form.competitor_state.label')}
              search
              onChange={(e, { value }) => setCompetitorState(value)}
              options={[
                {
                  key: COMPETITOR_STATE.NONE,
                  value: COMPETITOR_STATE.NONE,
                  text: I18n.t('page.sign_up.form.competitor_state.none_option'),
                  disabled: competitorState !== COMPETITOR_STATE.NONE,
                },
                {
                  key: COMPETITOR_STATE.RETURNER,
                  value: COMPETITOR_STATE.RETURNER,
                  text: I18n.t('page.sign_up.form.competitor_state.returner_option'),
                },
                {
                  key: COMPETITOR_STATE.NEW,
                  value: COMPETITOR_STATE.NEW,
                  text: I18n.t('page.sign_up.form.competitor_state.newcomer_option'),
                },
              ]}
              required
              value={competitorState}
            />
            {competitorState === COMPETITOR_STATE.NEW && (
              <>
                <I18nHTMLTranslate
                  // i18n-tasks-use t('page.sign_up.form.newcomer_intro')
                  i18nKey="page.sign_up.form.newcomer_intro"
                />
                <Form.Input
                  error={formValues.name.error}
                  id={formValues.name.id}
                  label={I18n.t('page.sign_up.form.name.label')}
                  name="user[name]"
                  onBlur={validation.name}
                  onChange={handleFormChange}
                  required
                  value={formValues.name.value}
                />
                {/* Replace following with form inputs for DOB, gender and country_iso2 */}
                <input type="text" name="user[dob]" value="2020-05-04" />
                <input type="text" name="user[gender]" value="m" />
                <input type="text" name="user[country_iso2]" value="AF" />
              </>
            )}
            {competitorState === COMPETITOR_STATE.RETURNER && (
              <>
                <p>{I18n.t('page.sign_up.form.returner_intro')}</p>
                <ClaimWcaIdWithReactQuery />
              </>
            )}
            <Form.Input
              name="commit"
              style={{ display: 'none' }}
              value="Sign up"
            />
            <FormField>
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={RECAPTCHA_PUBLIC_KEY}
                onChange={() => setCaptchaError(false)}
              />
              {captchaError && (
                <Message
                  error
                  content={I18n.t('page.sign_up.form.captcha.validation_error')}
                />
              )}
            </FormField>
            <Button
              onClick={(e) => {
                setHasClickedSignUpButton(true);
                const captchaValue = recaptchaRef.current.getValue();
                if (!captchaValue) {
                  setCaptchaError(true);
                  e.preventDefault();
                  return;
                }
                const validationsSuccess = Object.keys(formValues).every(
                  (key) => validation[key](e),
                );
                if (!validationsSuccess) {
                  e.preventDefault();
                }
              }}
              type="submit"
            >
              {I18n.t('page.sign_up.button')}
            </Button>
          </Form>
        </Card.Content>
      </Card>
    </Container>
  );
}
