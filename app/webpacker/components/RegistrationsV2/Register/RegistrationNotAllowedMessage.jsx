import React from 'react';
import { List, Message } from 'semantic-ui-react';
import I18nHTMLTranslate from '../../I18nHTMLTranslate';
import I18n from '../../../lib/i18n';
import { editPersonUrl } from '../../../lib/requests/routes.js.erb';

export default function RegistrationNotAllowedMessage({ reasons, competitionInfo, userInfo }) {
  return (
    <Message negative>
      {/* i18n-tasks-use t('registrations.please_fix_profile_html') */}
      <I18nHTMLTranslate
        i18nKey="registrations.please_fix_profile_html"
        options={{ comp: competitionInfo.name, profile: `<a href='${editPersonUrl(userInfo.id)}' >${I18n.t('registrations.profile')}</a>` }}
      />
      <List bulleted>
        {reasons.map((reason, index) => (
          <List.Item key={index}>
            <span dangerouslySetInnerHTML={{ __html: reason }} />
          </List.Item>
        ))}
      </List>
    </Message>
  );
}
