"use client";

import { createContext, type ReactNode, useContext, useState } from "react";
import { Alert, Spinner } from "@chakra-ui/react";
import { keepPreviousData } from "@tanstack/react-query";
import { useT } from "@/lib/i18n/useI18n";
import useAPI from "@/lib/wca/useAPI";
import type { operations } from "@/types/openapi";

type PaymentDenomination =
  operations["registrationPaymentDenomination"]["responses"][200]["content"]["application/json"];

interface PaymentAmountContextValue {
  donationIso: number;
  setDonationIso: (donationIso: number) => void;
  apiAmounts: PaymentDenomination["api_amounts"];
  humanAmount: string;
}

const PaymentAmountContext = createContext<
  PaymentAmountContextValue | undefined
>(undefined);

/**
 * What the competitor is about to pay: the outstanding fee plus whatever they choose to donate.
 * None of this depends on the payment provider, which reads the resulting amount from here.
 */
export function PaymentAmountProvider({
  registrationId,
  providerName,
  children,
}: {
  registrationId: number;
  providerName: string;
  children: ReactNode;
}) {
  const { t } = useT();

  const api = useAPI();

  const [donationIso, setDonationIso] = useState(0);

  // The outstanding fee includes per-event fees, and every provider wants its own denomination, so
  //   the amount is the backend's to compute rather than ours to reconstruct.
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
      // Changing the donation must not blank the amount out: the provider's fields unmount when
      //   they lose their amount, and unmounting takes the details the competitor already typed.
      placeholderData: keepPreviousData,
    },
  );

  // Without an amount there is nothing to hand the provider, so say so rather than spin forever.
  if (isError) {
    return (
      <Alert.Root status="error">
        <Alert.Indicator />
        <Alert.Title>
          {t("registrations.payment_form.errors.generic.failed", {
            provider: providerName,
          })}
        </Alert.Title>
      </Alert.Root>
    );
  }

  if (denomination === undefined) {
    return <Spinner />;
  }

  return (
    <PaymentAmountContext.Provider
      value={{
        donationIso,
        setDonationIso,
        apiAmounts: denomination.api_amounts,
        humanAmount: denomination.human_amount,
      }}
    >
      {children}
    </PaymentAmountContext.Provider>
  );
}

export function usePaymentAmount() {
  const context = useContext(PaymentAmountContext);
  if (context === undefined) {
    throw new Error(
      "usePaymentAmount must be used within a PaymentAmountProvider",
    );
  }
  return context;
}
