"use client";

import { Alert, FormatNumber, Link, Stack, Text } from "@chakra-ui/react";
import { useT } from "@/lib/i18n/useI18n";
import type { components } from "@/types/openapi";
import { DateTime } from "luxon";

type CompetitionInfo = components["schemas"]["CompetitionInfo"];
type Registration = components["schemas"]["RegistrationDataV2"];

export default function PaymentStep({
  competitionInfo,
  registration,
  deadline,
}: {
  competitionInfo: CompetitionInfo;
  registration: Registration | null;
  deadline?: string;
}) {
  const { t } = useT();

  const payment = registration?.payment;

  if (payment?.has_paid) {
    return (
      <Alert.Root status="success">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>
            {t("registrations.payment_form.labels.fees_paid")}
          </Alert.Title>
          <Alert.Description>
            <FormatNumber
              value={(payment.paid_amount_iso ?? 0) / 100}
              style="currency"
              currency={payment.currency_code ?? competitionInfo.currency_code}
            />
          </Alert.Description>
        </Alert.Content>
      </Alert.Root>
    );
  }

  return (
    <Stack>
      <Alert.Root status="warning">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>
            {t("competitions.registration_v2.info.payment_missing")}
          </Alert.Title>
          {deadline && (
            <Alert.Description>
              {t("competitions.registration_v2.register.until", {
                date: DateTime.fromISO(deadline).toLocaleString(
                  DateTime.DATETIME_FULL,
                ),
              })}
            </Alert.Description>
          )}
        </Alert.Content>
      </Alert.Root>
      {/* Paying requires the Stripe SDK, which this frontend does not embed yet, so we hand the
          competitor over to the page that can take their money. */}
      <Text>
        Paying is not available here yet. Please pay for your registration{" "}
        <Link
          href={`https://www.worldcubeassociation.org/competitions/${competitionInfo.id}/register`}
          variant="underline"
          target="_blank"
        >
          on the current registration page
        </Link>
        .
      </Text>
    </Stack>
  );
}
