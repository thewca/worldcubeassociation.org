import { DateTime } from 'luxon';
import React, { useEffect, useState } from 'react';
import { Message } from 'semantic-ui-react';
import I18nHTMLTranslate from '../../I18nHTMLTranslate';

export default function RegistrationClosedMessage({
  registrationStart,
  onTimerEnd,
}) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0, hours: 0, minutes: 0, seconds: 0,
  });

  const start = DateTime.fromISO(registrationStart);

  // Update the timer every second
  useEffect(() => {
    const updateTimer = () => {
      const now = DateTime.local();

      if (now >= start) {
        onTimerEnd();
        return;
      }

      const diff = start.diff(now, ['days', 'hours', 'minutes', 'seconds']).toObject();
      setTimeLeft({
        days: Math.floor(diff.days),
        hours: Math.floor(diff.hours),
        minutes: Math.floor(diff.minutes),
        seconds: Math.floor(diff.seconds),
      });
    };

    const intervalId = setInterval(updateTimer, 1000); // Update every second
    updateTimer(); // Initial call to set the state right away

    return () => clearInterval(intervalId); // Cleanup interval on unmount
  }, [registrationStart, onTimerEnd, start]);

  return (
    <Message color="blue">
      { timeLeft.days < 1 && timeLeft.hours < 1
        ? <I18nHTMLTranslate i18nKey="competitions.registration_v2.register.will_open_countdown" options={{ minutes: timeLeft.minutes, seconds: timeLeft.seconds }} />
        : <I18nHTMLTranslate i18nKey="registrations.will_open_html" options={{ days: start.toRelative(), time: DateTime.fromISO(registrationStart).toLocaleString(DateTime.DATETIME_FULL) }} />}
    </Message>
  );
}
