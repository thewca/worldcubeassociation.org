"use client";

import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
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
import { keepPreviousData } from "@tanstack/react-query";
import { useState } from "react";
import { LuCreditCard } from "react-icons/lu";
import { useT } from "@/lib/i18n/useI18n";
import CurrencyValue from "@/components/CurrencyValue";
import { LOWEST_DENOMINATION_PER_UNIT } from "@/lib/wca/data/wca";
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

  const [isPaying, setIsPaying] = useState(false);
  const [isDonating, setIsDonating] = useState(false);

  const showError = (messageKey: string) =>
    toaster.create({
      id: "payment-error",
      type: "error",
      description: t(messageKey, {
        provider: t("payments.payment_providers.stripe"),
      }),
    });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Stripe.js has not finished loading, so there is nothing to confirm against yet.
    if (!stripe || !elements) {
      return;
    }

    setIsPaying(true);

    // Stripe requires `submit` before any async work, so that it can validate the entered details
    //   while the user gesture is still fresh.
    const { error: submitError } = await elements.submit();

    if (submitError) {
      showError("registrations.payment_form.errors.generic.failed");
      setIsPaying(false);
      return;
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
      showError("registrations.payment_form.errors.generic.failed");
      setIsPaying(false);
      return;
    }

    // On success the browser leaves for Stripe and comes back to the monolith, so anything after
    //   this only runs when the payment could not even be started.
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      clientSecret: data.client_secret,
      confirmParams: { return_url: paymentCompletionUrl(competitionInfo.id) },
    });

    if (confirmError) {
      showError("registrations.payment_form.errors.generic.failed");
    }

    setIsPaying(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="4">
        <PaymentElement />

        {competitionInfo.enable_donations && (
          <Stack gap="2">
            <Checkbox.Root
              checked={isDonating}
              onCheckedChange={(e) => {
                setIsDonating(!!e.checked);
                // Unticking has to take the donation with it, otherwise the competitor keeps
                //   paying an amount they can no longer see.
                onDonationChange(0);
              }}
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
                    donationIso / LOWEST_DENOMINATION_PER_UNIT
                  ).toString()}
                  onValueChange={(e) =>
                    onDonationChange(
                      Number.isNaN(e.valueAsNumber)
                        ? 0
                        : Math.round(
                            e.valueAsNumber * LOWEST_DENOMINATION_PER_UNIT,
                          ),
                    )
                  }
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

        <HStack justify="space-between">
          <Text fontWeight="medium">
            {t("registrations.payment_form.labels.subtotal")}
          </Text>
          <Text>{humanAmount}</Text>
        </HStack>

        <Button
          type="submit"
          width="full"
          colorPalette="green"
          loading={isPaying}
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

  // The entry fee includes per-event fees, and Stripe wants its own denomination, so the amount is
  //   the backend's to compute rather than ours to reconstruct.
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

      {hasPassed(competitionInfo.registration_close) ? (
        <Alert.Root status="error">
          <Alert.Indicator />
          <Alert.Title>
            {t("registrations.payment_form.errors.registration_closed")}
          </Alert.Title>
        </Alert.Root>
      ) : (
        // The registration is created by a queue worker, so there is a window in which the payment
        //   step is reachable but the registration it would pay for does not exist yet.
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
