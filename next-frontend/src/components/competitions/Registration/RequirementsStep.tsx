"use client";

import { Alert, Checkbox, VStack } from "@chakra-ui/react";
import { useState } from "react";
import { useT } from "@/lib/i18n/useI18n";
import NextStepButton from "@/components/competitions/Registration/NextStepButton";

export default function RequirementsStep({
  leadsToSummary,
  onNext,
}: {
  leadsToSummary: boolean;
  onNext: () => void;
}) {
  const { t } = useT();

  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  return (
    <VStack gap="3">
      <Checkbox.Root
        variant="solid"
        width="full"
        cursor="pointer"
        checked={hasAcknowledged}
        onCheckedChange={(e) => setHasAcknowledged(!!e.checked)}
      >
        <Checkbox.HiddenInput />
        <Alert.Root status="success">
          <Alert.Indicator>
            <Checkbox.Control />
          </Alert.Indicator>
          <Alert.Title asChild>
            <Checkbox.Label>
              {t("competitions.registration_v2.requirements.acknowledgement")}
            </Checkbox.Label>
          </Alert.Title>
        </Alert.Root>
      </Checkbox.Root>
      <NextStepButton
        leadsToSummary={leadsToSummary}
        onNext={onNext}
        disabled={!hasAcknowledged}
      />
    </VStack>
  );
}
