"use client";

import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import {
  loadStripe,
  type Stripe,
  type StripeElements,
} from "@stripe/stripe-js";
import {
  Alert,
  Button,
  Checkbox,
  Field,
  HStack,
  NumberInput,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { keepPreviousData, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { LuCreditCard } from "react-icons/lu";
import { useT } from "@/lib/i18n/useI18n";
import CurrencyValue from "@/components/CurrencyValue";
import { hasPassed } from "@/lib/wca/dates";
import useAPI, { useAPIClient } from "@/lib/wca/useAPI";
import { paymentCompletionUrl } from "@/lib/wca/payments/stripe";
import { toaster } from "@/components/ui/toaster";
import type { components } from "@/types/openapi";
import { DateTime } from "luxon";

type CompetitionInfo = components["schemas"]["CompetitionInfo"];
type Registration = components["schemas"]["RegistrationDataV2"];
type PaymentStepParameters =
  components["schemas"]["PaymentStepConfig"]["parameters"];

function PaymentForm({
  competitionInfo,
  registrationId,
  donationIso,
  onDonationChange,
  humanAmount,
}: {
  competitionInfo: CompetitionInfo;
  registrationId: number;
  donationIso: number;
  onDonationChange: (donationIso: number) => void;
  humanAmount: string;
}) {
  const { t } = useT();

  const stripe = useStripe();
  const elements = useElements();
  const apiClient = useAPIClient();

  const [isDonating, setIsDonating] = useState(false);

  const payRegistration = useMutation({
    mutationFn: async ({
      stripe,
      elements,
    }: {
      stripe: Stripe;
      elements: StripeElements;
    }) => {
      // Stripe requires `submit` before any async work, so that it can validate the entered details
      //   while the user gesture is still fresh.
      const { error: submitError } = await elements.submit();

      if (submitError) {
        throw submitError;
      }

      const { data, error } = await apiClient.GET(
        "/v1/registrations/{registrationId}/payment_ticket",
        {
          params: {
            path: { registrationId },
            query: { iso_donation_amount: donationIso },
          },
        },
      );

      if (error) {
        throw error;
      }

      // On success the browser leaves for Stripe and comes back to the monolith, so anything after
      //   this only runs when the payment could not even be started.
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret: data.client_secret,
        confirmParams: { return_url: paymentCompletionUrl(competitionInfo.id) },
      });

      if (confirmError) {
        throw confirmError;
      }
    },
    onError: () =>
      toaster.create({
        id: "payment-error",
        type: "error",
        description: t("registrations.payment_form.errors.generic.failed", {
          provider: t("payments.payment_providers.stripe"),
        }),
      }),
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    // Only try to confirm once Stripe has actually finished loading
    if (stripe && elements) {
      payRegistration.mutate({ stripe, elements });
    }
  };

  // Unticking has to take the donation with it, otherwise the competitor keeps paying an amount
  //   they can no longer see.
  const toggleDonation = (isChecked: boolean) => {
    setIsDonating(isChecked);
    onDonationChange(0);
  };

  const changeDonation = (donationUnits: number) =>
    onDonationChange(
      Number.isNaN(donationUnits)
        ? 0
        : Math.round(donationUnits * competitionInfo.currency_subunit_to_unit),
    );

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="4">
        <PaymentElement />

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

        {/* The amount carries its currency's full name, so on a phone it is too long to sit beside
            the label and drops onto its own line instead of breaking mid-word. */}
        <HStack justify="space-between" flexWrap="wrap">
          <Text fontWeight="medium">
            {t("registrations.payment_form.labels.subtotal")}
          </Text>
          <Text textAlign="end">{humanAmount}</Text>
        </HStack>

        <Button
          type="submit"
          width="full"
          colorPalette="green"
          loading={payRegistration.isPending}
          disabled={!stripe || !elements}
        >
          <LuCreditCard />
          {t("registrations.payment_form.button_text")}
        </Button>
      </Stack>
    </form>
  );
}

function StripePayment({
  competitionInfo,
  registrationId,
  parameters,
}: {
  competitionInfo: CompetitionInfo;
  registrationId: number;
  parameters: PaymentStepParameters;
}) {
  const { t } = useT();

  const api = useAPI();

  const [donationIso, setDonationIso] = useState(0);

  // `loadStripe` injects a script tag, so it must run once rather than on every render. The key
  //   and the connected account belong to this competition, which is why this cannot be the
  //   module-level constant Stripe's own examples use.
  const [stripePromise] = useState(() =>
    loadStripe(parameters.stripePublishableKey, {
      stripeAccount: parameters.connectedAccountId,
    }),
  );

  // The outstanding fee includes per-event fees, and Stripe wants its own denomination, so the
  //   amount is the backend's to compute rather than ours to reconstruct.
  const { data: denomination, isError } = api.useQuery(
    "get",
    "/v1/registrations/{registrationId}/payment_denomination",
    {
      params: {
        path: { registrationId },
        query: { iso_donation_amount: donationIso },
      },
    },
    {
      // Changing the donation must not blank the amount out: `Elements` unmounts when it loses its
      //   options, and unmounting takes the card details the competitor already typed with it.
      placeholderData: keepPreviousData,
    },
  );

  // Without an amount there is nothing to hand Stripe, so say so rather than spin forever.
  if (isError) {
    return (
      <Alert.Root status="error">
        <Alert.Indicator />
        <Alert.Title>
          {t("registrations.payment_form.errors.generic.failed", {
            provider: t("payments.payment_providers.stripe"),
          })}
        </Alert.Title>
      </Alert.Root>
    );
  }

  if (denomination === undefined) {
    return <Spinner />;
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        mode: "payment",
        amount: denomination.api_amounts.stripe,
        currency: competitionInfo.currency_code.toLowerCase(),
      }}
    >
      <PaymentForm
        competitionInfo={competitionInfo}
        registrationId={registrationId}
        donationIso={donationIso}
        onDonationChange={setDonationIso}
        humanAmount={denomination.human_amount}
      />
    </Elements>
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

            <StripePayment
              competitionInfo={competitionInfo}
              registrationId={registration.id}
              parameters={parameters}
            />
          </>
        )
      )}
    </Stack>
  );
}
