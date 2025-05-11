import { DateTime } from 'luxon';
import React, { useCallback } from 'react';
import { Message } from 'semantic-ui-react';
import I18nHTMLTranslate from '../../I18nHTMLTranslate';
import { fullTimeDiff } from '../../../lib/utils/dates';
import usePerpetualState from '../hooks/usePerpetualState';

export default function RegistrationOpeningMessage({
  registrationStart,
}) {
  const start = DateTime.fromISO(registrationStart);
  const recomputeDiff = useCallback(() => fullTimeDiff(start), [start]);

  const timeLeft = usePerpetualState(recomputeDiff);

  // The values getting negative means that the deadline definitely passed.
  if (timeLeft.seconds < 0 || timeLeft.minutes < 0 || timeLeft.hours < 0 || timeLeft.days < 0) {
    return null;
  }

  return (
    <Message info>
      { timeLeft.days < 1 && timeLeft.hours < 1
        ? <I18nHTMLTranslate i18nKey="competitions.registration_v2.register.will_open_countdown" options={timeLeft} />
        // i18n-tasks-use t('registrations.will_open_html')
        : <I18nHTMLTranslate i18nKey="registrations.will_open_html" options={{ days: start.toRelative(), time: start.toLocaleString(DateTime.DATETIME_FULL) }} />}
    </Message>
  );
}
