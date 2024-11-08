import { DateTime } from 'luxon';
import React, { useEffect, useState } from 'react';
import { Message } from 'semantic-ui-react';
import I18nHTMLTranslate from '../../I18nHTMLTranslate';
import { fullTimeDiff } from '../../../lib/utils/dates';

export default function RegistrationClosedMessage({
  registrationStart,
  onTimerEnd,
}) {
  const start = DateTime.fromISO(registrationStart);
  const [timeLeft, setTimeLeft] = useState(fullTimeDiff(start));

  useEffect(() => {
    if (timeLeft.days === 0
      && timeLeft.hours === 0
      && timeLeft.minutes === 0
      && timeLeft.seconds === 0) {
      onTimerEnd();
    }
  }, [onTimerEnd, timeLeft]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTimeLeft(fullTimeDiff(start));
    }, 1000); // Update every second

    return () => clearInterval(intervalId); // Cleanup interval on unmount
  }, [registrationStart, onTimerEnd, start]);

  return (
    <Message color="blue">
      { timeLeft.days < 1 && timeLeft.hours < 1
        ? <I18nHTMLTranslate i18nKey="competitions.registration_v2.register.will_open_countdown" options={{ minutes: timeLeft.minutes, seconds: timeLeft.seconds }} />
        : <I18nHTMLTranslate i18nKey="registrations.will_open_html" options={{ days: start.toRelative(), time: start.toLocaleString(DateTime.DATETIME_FULL) }} />}
    </Message>
  );
}
