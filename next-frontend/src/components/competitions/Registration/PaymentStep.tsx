"use client";

import {
  Alert,
  Checkbox,
  Field,
  HStack,
  NumberInput,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useState } from "react";
import { useT } from "@/lib/i18n/useI18n";
import CurrencyValue from "@/components/CurrencyValue";
import { hasPassed } from "@/lib/wca/dates";
import StripePayment from "@/components/competitions/Registration/StripePayment";
import {
  PaymentAmountProvider,
  usePaymentAmount,
} from "@/providers/PaymentAmountProvider";
import type { components } from "@/types/openapi";
import { DateTime } from "luxon";

type CompetitionInfo = components["schemas"]["CompetitionInfo"];
type Registration = components["schemas"]["RegistrationDataV2"];
type PaymentStepParameters =
  components["schemas"]["PaymentStepConfig"]["parameters"];

function DonationFields({
  competitionInfo,
}: {
  competitionInfo: CompetitionInfo;
}) {
  const { t } = useT();

  const { donationIso, setDonationIso } = usePaymentAmount();

  const [isDonating, setIsDonating] = useState(false);

  // Unticking has to take the donation with it, otherwise the competitor keeps paying an amount
  //   they can no longer see.
  const toggleDonation = (isChecked: boolean) => {
    setIsDonating(isChecked);
    setDonationIso(0);
  };

  const changeDonation = (donationUnits: number) =>
    setDonationIso(
      Number.isNaN(donationUnits)
        ? 0
        : Math.round(donationUnits * competitionInfo.currency_subunit_to_unit),
    );

  return (
    <>
      {competitionInfo.enable_donations && (
        <Stack gap="2">
          <Checkbox.Root
            width="full"
            // The label runs to a sentence, so on a narrow screen it wraps and the box belongs
            //   beside its first line rather than centred against the whole paragraph.
            alignItems="start"
            checked={isDonating}
            onCheckedChange={(e) => toggleDonation(!!e.checked)}
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control />
            <Checkbox.Label>
              {t("registrations.payment_form.labels.show_donation")}
            </Checkbox.Label>
          </Checkbox.Root>

          {isDonating && (
            <Field.Root>
              <Field.Label>
                {t("registrations.payment_form.labels.donation")} (
                {competitionInfo.currency_code})
              </Field.Label>
              <NumberInput.Root
                min={0}
                width="full"
                value={(
                  donationIso / competitionInfo.currency_subunit_to_unit
                ).toString()}
                onValueChange={(e) => changeDonation(e.valueAsNumber)}
              >
                <NumberInput.Input />
                <NumberInput.Control />
              </NumberInput.Root>
            </Field.Root>
          )}
        </Stack>
      )}

      {donationIso > competitionInfo.base_entry_fee_lowest_denomination && (
        <Alert.Root status="warning">
          <Alert.Indicator />
          <Alert.Title>
            {t("registrations.payment_form.alerts.amount_rather_high")}
          </Alert.Title>
        </Alert.Root>
      )}
    </>
  );
}

/** The donation the competitor may add, and what they pay with it, whichever provider takes it. */
function PaymentAmountDetails({
  competitionInfo,
}: {
  competitionInfo: CompetitionInfo;
}) {
  const { t } = useT();

  const { humanAmount } = usePaymentAmount();

  return (
    <>
      <DonationFields competitionInfo={competitionInfo} />

      {/* The amount carries its currency's full name, so on a phone it is too long to sit beside
          the label and drops onto its own line instead of breaking mid-word. */}
      <HStack justify="space-between" flexWrap="wrap">
        <Text fontWeight="medium">
          {t("registrations.payment_form.labels.subtotal")}
        </Text>
        <Text textAlign="end">{humanAmount}</Text>
      </HStack>
    </>
  );
}

export default function PaymentStep({
  competitionInfo,
  registration,
  parameters,
  deadline,
}: {
  competitionInfo: CompetitionInfo;
  registration: Registration | null;
  parameters: PaymentStepParameters;
  deadline?: string;
}) {
  const { t } = useT();

  const isRegistrationClosed = hasPassed(competitionInfo.registration_close);

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
            <CurrencyValue
              lowestDenomination={payment.paid_amount_iso}
              currencyCode={payment.currency_code}
              subunitToUnit={payment.currency_subunit_to_unit}
            />
          </Alert.Description>
        </Alert.Content>
      </Alert.Root>
    );
  }

  return (
    <Stack gap="4">
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

      {isRegistrationClosed ? (
        <Alert.Root status="error">
          <Alert.Indicator />
          <Alert.Title>
            {t("registrations.payment_form.errors.registration_closed")}
          </Alert.Title>
        </Alert.Root>
      ) : (
        registration !== null && (
          <>
            <Alert.Root status="info">
              <Alert.Indicator />
              <Alert.Title>
                {t("registrations.payment_form.hints.payment_button")}
              </Alert.Title>
            </Alert.Root>

            <PaymentAmountProvider
              registrationId={registration.id}
              providerName={t("payments.payment_providers.stripe")}
            >
              <StripePayment
                competitionInfo={competitionInfo}
                registrationId={registration.id}
                parameters={parameters}
              >
                <PaymentAmountDetails competitionInfo={competitionInfo} />
              </StripePayment>
            </PaymentAmountProvider>
          </>
        )
      )}
    </Stack>
  );
}
