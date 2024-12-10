import React from 'react';
import { List, Message } from 'semantic-ui-react';
import I18nHTMLTranslate from '../../I18nHTMLTranslate';
import I18n from '../../../lib/i18n';
import { editPersonUrl } from '../../../lib/requests/routes.js.erb';

export default function RegistrationNotAllowedMessage({ reasons, competition, userInfo }) {
  return (
    <Message negative>
      {/* i18n-tasks-use t('registrations.please_fix_profile_html') */}
      <I18nHTMLTranslate
        i18nKey="registrations.please_fix_profile_html"
        options={{ comp: competition.name, profile: `<a href='${editPersonUrl(userInfo.id)}' >${I18n.t('registrations.profile')}</a>` }}
      />
      <List>
        {reasons.map((reason) => (
          <List.Item key={reason}>{reason}</List.Item>
        ))}
      </List>
    </Message>
  );
}
