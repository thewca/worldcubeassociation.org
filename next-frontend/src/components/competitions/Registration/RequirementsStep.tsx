"use client";

import { Alert, Button, Checkbox, VStack } from "@chakra-ui/react";
import { useT } from "@/lib/i18n/useI18n";

export default function RequirementsStep({
  hasAcknowledged,
  onAcknowledgedChange,
  onContinue,
}: {
  hasAcknowledged: boolean;
  onAcknowledgedChange: (acknowledged: boolean) => void;
  onContinue: () => void;
}) {
  const { t } = useT();

  return (
    <VStack gap="3">
      <Checkbox.Root
        variant="solid"
        width="full"
        checked={hasAcknowledged}
        onCheckedChange={(e) => onAcknowledgedChange(!!e.checked)}
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
      <Button
        width="full"
        disabled={!hasAcknowledged}
        onClick={onContinue}
        colorPalette="blue"
      >
        {t("competitions.registration_v2.requirements.accept")}
      </Button>
    </VStack>
  );
}
