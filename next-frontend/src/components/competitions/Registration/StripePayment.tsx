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
import { Button, Stack } from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { LuCreditCard } from "react-icons/lu";
import { useT } from "@/lib/i18n/useI18n";
import { useAPIClient } from "@/lib/wca/useAPI";
import { paymentCompletionUrl } from "@/lib/wca/payments/stripe";
import { toaster } from "@/components/ui/toaster";
import { usePaymentAmount } from "@/providers/PaymentAmountProvider";
import type { components } from "@/types/openapi";

type CompetitionInfo = components["schemas"]["CompetitionInfo"];
type PaymentStepParameters =
  components["schemas"]["PaymentStepConfig"]["parameters"];

function StripePaymentForm({
  competitionInfo,
  registrationId,
  children,
}: {
  competitionInfo: CompetitionInfo;
  registrationId: number;
  children: ReactNode;
}) {
  const { t } = useT();

  const { donationIso } = usePaymentAmount();

  const stripe = useStripe();
  const elements = useElements();
  const apiClient = useAPIClient();

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

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="4">
        <PaymentElement />

        {children}

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

export default function StripePayment({
  competitionInfo,
  registrationId,
  parameters,
  children,
}: {
  competitionInfo: CompetitionInfo;
  registrationId: number;
  parameters: PaymentStepParameters;
  children: ReactNode;
}) {
  const { apiAmounts } = usePaymentAmount();

  // `loadStripe` injects a script tag, so it must run once rather than on every render. The key
  //   and the connected account belong to this competition, which is why this cannot be the
  //   module-level constant Stripe's own examples use.
  const [stripePromise] = useState(() =>
    loadStripe(parameters.stripePublishableKey, {
      stripeAccount: parameters.connectedAccountId,
    }),
  );

  return (
    <Elements
      stripe={stripePromise}
      options={{
        mode: "payment",
        amount: apiAmounts.stripe,
        currency: competitionInfo.currency_code.toLowerCase(),
      }}
    >
      <StripePaymentForm
        competitionInfo={competitionInfo}
        registrationId={registrationId}
      >
        {children}
      </StripePaymentForm>
    </Elements>
  );
}
