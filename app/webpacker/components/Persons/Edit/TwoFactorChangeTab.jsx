import React, { useCallback, useEffect, useState } from 'react';
import {
  Button, Message, List, Modal, Header, Form, Segment,
} from 'semantic-ui-react';
import I18nHTMLTranslate from '../../I18nHTMLTranslate';
import I18n from '../../../lib/i18n';
import { enable2FaUrl, disable2FaUrl } from '../../../lib/requests/routes.js.erb';

export default function TwoFactorChangeTab({ user, recentlyAuthenticated }) {
  const [backupCodes, setBackupCodes] = useState(user.otp_backup_codes);

  // Hack to allow this with devise
  useEffect(() => {
    if (!recentlyAuthenticated) {
      document.getElementById('2fa-check').style.display = 'block';
    }
  }, [recentlyAuthenticated]);

  // TODO
  const handleGenerateBackupCodes = useCallback(() => {
    setBackupCodes('aa');
  }, []);

  if (!recentlyAuthenticated) {
    return <Modal dimmer="blurring" open />;
  }

  return (
    <Segment>
      <I18nHTMLTranslate
        i18nKey="devise.sessions.new.2fa.support_desc_html"
        options={{
          two_factor_link:
            `<a href='https://en.wikipedia.org/wiki/Multi-factor_authentication' target='_blank'>${I18n.t(
              'devise.sessions.new.2fa.name',
            )}</a>`,
        }}
      />
      <List bulleted>
        <List.Item>{I18n.t('devise.sessions.new.2fa.options.app')}</List.Item>
        <List.Item>{I18n.t('devise.sessions.new.2fa.options.recovery')}</List.Item>
        <List.Item>{I18n.t('devise.sessions.new.2fa.options.email')}</List.Item>
      </List>
      <Message>
        <I18nHTMLTranslate
          i18nKey="devise.sessions.new.2fa.status_html"
          options={{
            status: `<b>${I18n.t(
              user.otp_required_for_login
                ? 'devise.sessions.new.2fa.enabled'
                : 'devise.sessions.new.2fa.disabled',
            )}</b>`,
          }}
        />
      </Message>
      {!user.otp_required_for_login ? (
        <Form action={enable2FaUrl()} method="POST">
          <input
            type="hidden"
            name="authenticity_token"
            value={document.querySelector('meta[name=csrf-token]').content}
          />
          <Form.Button primary type="submit">
            {I18n.t('devise.sessions.new.2fa.enable')}
          </Form.Button>
        </Form>
      ) : (
        <>
          <I18nHTMLTranslate i18nKey="devise.sessions.new.2fa.reset_if_needed" />
          <Form action={enable2FaUrl()} method="POST">
            <input
              type="hidden"
              name="authenticity_token"
              value={document.querySelector('meta[name=csrf-token]').content}
            />
            <Form.Button type="submit" negative>
              {I18n.t('devise.sessions.new.2fa.reset')}
            </Form.Button>
          </Form>
          <I18nHTMLTranslate i18nKey="devise.sessions.new.2fa.reset_warning" />

          <Header as="h2">{I18n.t('devise.sessions.new.2fa.methods')}</Header>
          <I18nHTMLTranslate i18nKey="devise.sessions.new.2fa.methods_description" />

          <Header as="h3">{I18n.t('devise.sessions.new.2fa.dedicated_app')}</Header>
          <I18nHTMLTranslate
            i18nKey="devise.sessions.new.2fa.dedicated_app_desc_html"
            options={{
              authy: '<a href=\'https://authy.com/download/\'>Authy</a>',
              google: '<a href=\'https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2\'>Google Authenticator</a>',
              microsoft: '<a href=\'https://www.microsoft.com/en-us/account/authenticator\'>Microsoft Authenticator</a>',
            }}
          />
          <I18nHTMLTranslate
            i18nKey="devise.sessions.new.2fa.scan_qrcode_html"
            options={{
              here: `<a href='${user.otpProvisioningUri}'>${I18n.t('common.here')}</a>`,
            }}
          />
          <div dangerouslySetInnerHTML={{ __html: user.qrCodeSvg }} />

          <Header as="h3">{I18n.t('devise.sessions.new.2fa.backup_codes')}</Header>
          <I18nHTMLTranslate i18nKey="devise.sessions.new.2fa.backup_codes_desc" />
          {!backupCodes ? (
            <>
              <I18nHTMLTranslate i18nKey="devise.sessions.new.2fa.no_backup_codes" />
              <Button primary onClick={handleGenerateBackupCodes}>
                {I18n.t('devise.sessions.new.2fa.generate_backup_codes')}
              </Button>
            </>
          ) : (
            <pre>{backupCodes.join('\n')}</pre>
          )}
          <Message>
            {I18n.t('devise.sessions.new.2fa.backup_codes_warning')}
          </Message>

          <Header as="h3">{I18n.t('devise.sessions.new.2fa.email_auth')}</Header>
          <I18nHTMLTranslate i18nKey="devise.sessions.new.2fa.email_auth_desc" />

          <Header as="h2">{I18n.t('devise.sessions.new.2fa.disable_section_title')}</Header>
          <I18nHTMLTranslate i18nKey="devise.sessions.new.2fa.disable_section_content" />
          <Form action={enable2FaUrl()} method="POST">
            <input
              type="hidden"
              name="authenticity_token"
              value={document.querySelector('meta[name=csrf-token]').content}
            />
            <Button negative type="submit">
              {I18n.t('devise.sessions.new.2fa.disable')}
            </Button>
          </Form>
        </>
      )}
    </Segment>
  );
}
