import { DateTime } from 'luxon';
import React from 'react';
import { Message } from 'semantic-ui-react';
import I18nHTMLTranslate from '../../I18nHTMLTranslate';

export default function RegistrationClosedMessage({ registrationEnd }) {
  const end = DateTime.fromISO(registrationEnd);
  return (
    <Message negative>
      <I18nHTMLTranslate i18nKey="registrations.closed_html" options={{ days: end.toRelative(), time: end.toLocaleString(DateTime.DATETIME_FULL) }} />
    </Message>
  );
}
