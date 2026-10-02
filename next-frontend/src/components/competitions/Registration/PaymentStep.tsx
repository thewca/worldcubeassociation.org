"use client";

import { Alert, Stack } from "@chakra-ui/react";
import { useT } from "@/lib/i18n/useI18n";
import CurrencyValue from "@/components/CurrencyValue";
import PaymentDue from "@/components/competitions/Registration/PaymentDue";
import NextStepButton from "@/components/competitions/Registration/NextStepButton";
import type { components } from "@/types/openapi";

type CompetitionInfo = components["schemas"]["CompetitionInfo"];
type Registration = components["schemas"]["RegistrationDataV2"];

export default function PaymentStep({
  competitionInfo,
  registration,
  deadline,
  leadsToSummary,
  onNext,
}: {
  competitionInfo: CompetitionInfo;
  registration: Registration | null;
  deadline?: string;
  leadsToSummary: boolean;
  onNext: () => void;
}) {
  const { t } = useT();

  const payment = registration?.payment;

  return (
    <Stack>
      {payment?.has_paid ? (
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
      ) : (
        <PaymentDue competitionInfo={competitionInfo} deadline={deadline} />
      )}
      <NextStepButton leadsToSummary={leadsToSummary} onNext={onNext} />
    </Stack>
  );
}
