import { DateTime } from 'luxon';
import React, { useCallback } from 'react';
import { Message } from 'semantic-ui-react';
import I18nHTMLTranslate from '../../I18nHTMLTranslate';
import { fullTimeDiff } from '../../../lib/utils/dates';
import usePerpetualState from '../hooks/usePerpetualState';

export default function RegistrationClosingMessage({
  registrationEnd,
}) {
  const end = DateTime.fromISO(registrationEnd);
  const recomputeDiff = useCallback(() => fullTimeDiff(end), [end]);

  const timeLeft = usePerpetualState(recomputeDiff);

  if (timeLeft.seconds < 0) {
    return (
      <Message negative>
        {/* i18n-tasks-use t('registrations.closed_html') */}
        <I18nHTMLTranslate i18nKey="registrations.closed_html" options={{ days: end.toRelative(), time: end.toLocaleString(DateTime.DATETIME_FULL) }} />
      </Message>
    );
  }

  // If there is more than one hour left, don't bother displaying anything.
  //   Note that we also need to check days because you might open the page
  //   _exactly_ 3 days and 0 hours before registration close.
  if (timeLeft.days >= 1 || timeLeft.hours >= 1) {
    return null;
  }

  return (
    <Message info>
      { timeLeft.days < 1 && timeLeft.hours < 1 && timeLeft.minutes < 30
        ? <I18nHTMLTranslate i18nKey="competitions.registration_v2.register.will_close_countdown" options={timeLeft} />
        // i18n-tasks-use t('registrations.will_close_html')
        : <I18nHTMLTranslate i18nKey="registrations.will_close_html" options={{ days: end.toRelative(), time: end.toLocaleString(DateTime.DATETIME_FULL) }} />}
    </Message>
  );
}
