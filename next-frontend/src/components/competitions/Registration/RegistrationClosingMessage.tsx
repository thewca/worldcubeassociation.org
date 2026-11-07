"use client";

import { Alert } from "@chakra-ui/react";
import { DateTime } from "luxon";
import { Trans } from "react-i18next";
import { useT } from "@/lib/i18n/useI18n";
import { fullTimeDiff } from "@/lib/wca/dates";
import usePerpetualState from "@/lib/hooks/usePerpetualState";

// Below this many minutes we switch from "closes on <date>" to a live ticking countdown.
const COUNTDOWN_THRESHOLD_MINUTES = 30;

export default function RegistrationClosingMessage({
  registrationEnd,
}: {
  registrationEnd: string;
}) {
  const { t } = useT();

  const end = DateTime.fromISO(registrationEnd);
  const timeLeft = usePerpetualState(() => fullTimeDiff(end));

  const hasClosed =
    timeLeft.days < 0 ||
    timeLeft.hours < 0 ||
    timeLeft.minutes < 0 ||
    timeLeft.seconds < 0;

  if (hasClosed) {
    return (
      <Alert.Root status="error" width="full">
        <Alert.Indicator />
        <Alert.Title>
          <Trans
            t={t}
            i18nKey="registrations.closed_html"
            values={{
              days: end.toRelative(),
              time: end.toLocaleString(DateTime.DATETIME_FULL),
            }}
          />
        </Alert.Title>
      </Alert.Root>
    );
  }

  // With more than an hour to go there is nothing urgent to say. Days is checked too, because
  //   the page may be opened exactly N days and 0 hours before registration closes.
  if (timeLeft.days >= 1 || timeLeft.hours >= 1) {
    return null;
  }

  return (
    <Alert.Root status="info" width="full">
      <Alert.Indicator />
      <Alert.Title>
        {timeLeft.minutes < COUNTDOWN_THRESHOLD_MINUTES ? (
          t("competitions.registration_v2.register.will_close_countdown", {
            minutes: timeLeft.minutes,
            seconds: timeLeft.seconds,
          })
        ) : (
          <Trans
            t={t}
            i18nKey="registrations.will_close_html"
            values={{
              days: end.toRelative(),
              time: end.toLocaleString(DateTime.DATETIME_FULL),
            }}
          />
        )}
      </Alert.Title>
    </Alert.Root>
  );
}
