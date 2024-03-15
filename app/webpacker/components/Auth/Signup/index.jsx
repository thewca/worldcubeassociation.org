import React, { useRef, useState } from 'react';
import {
  Button, Card, CardHeader, Container, Form, FormField, Message,
} from 'semantic-ui-react';
import ReCAPTCHA from 'react-google-recaptcha';
import { GOOGLE_RECAPTCHA_SITE_KEY } from '../../../lib/wca-data.js.erb';
import I18n from '../../../lib/i18n';
import WcaSearch from '../../SearchWidget/WcaSearch';
import { emailRegex } from '../../../lib/helpers/regex';
import ClaimWcaIdWithReactQuery from './ClaimWcaId';

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
              label="Please let us know if you have competed in a WCA competition before:"
              search
              onChange={(e, { value }) => setCompetitorState(value)}
              options={[
                {
                  key: COMPETITOR_STATE.NONE,
                  value: COMPETITOR_STATE.NONE,
                  text: 'Please select...',
                  disabled: competitorState !== COMPETITOR_STATE.NONE,
                },
                {
                  key: COMPETITOR_STATE.NEW,
                  value: COMPETITOR_STATE.NEW,
                  text: 'I have never competed in a WCA competition.',
                },
                {
                  key: COMPETITOR_STATE.RETURNER,
                  value: COMPETITOR_STATE.RETURNER,
                  text: 'I have competed in a WCA competition.',
                },
              ]}
              required
              value={competitorState}
            />
            {competitorState === COMPETITOR_STATE.NEW && (
              <>
                <input type="text" name="user[name]" value="abc" />
                <input type="text" name="user[dob]" value="2020-05-04" />
                <input type="text" name="user[gender]" value="m" />
                <input type="text" name="user[country_iso2]" value="AF" />
                <input type="text" name="user[claiming_wca_id]" value="false" />
              </>
            )}
            {competitorState === COMPETITOR_STATE.RETURNER && (
              <>
                <p>Welcome back! To create your WCA website account, we need to know the WCA ID under which you competed.</p>
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
                sitekey={GOOGLE_RECAPTCHA_SITE_KEY}
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
