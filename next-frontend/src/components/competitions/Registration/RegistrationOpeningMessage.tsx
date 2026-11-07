"use client";

import { Alert } from "@chakra-ui/react";
import { DateTime } from "luxon";
import { Trans } from "react-i18next";
import { useT } from "@/lib/i18n/useI18n";
import { fullTimeDiff } from "@/lib/wca/dates";
import usePerpetualState from "@/lib/hooks/usePerpetualState";

export default function RegistrationOpeningMessage({
  registrationStart,
}: {
  registrationStart: string;
}) {
  const { t } = useT();

  const start = DateTime.fromISO(registrationStart);
  const timeLeft = usePerpetualState(() => fullTimeDiff(start));

  // Any component going negative means the moment has definitely passed.
  if (
    timeLeft.days < 0 ||
    timeLeft.hours < 0 ||
    timeLeft.minutes < 0 ||
    timeLeft.seconds < 0
  ) {
    return null;
  }

  const isImminent = timeLeft.days < 1 && timeLeft.hours < 1;

  return (
    <Alert.Root status="info" width="full">
      <Alert.Indicator />
      <Alert.Title>
        {isImminent ? (
          t("competitions.registration_v2.register.will_open_countdown", {
            minutes: timeLeft.minutes,
            seconds: timeLeft.seconds,
          })
        ) : (
          <Trans
            t={t}
            i18nKey="registrations.will_open_html"
            values={{
              days: start.toRelative(),
              time: start.toLocaleString(DateTime.DATETIME_FULL),
            }}
          />
        )}
      </Alert.Title>
    </Alert.Root>
  );
}
