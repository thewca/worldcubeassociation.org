"use client";

import { Alert, Button, Checkbox, VStack } from "@chakra-ui/react";
import { useState } from "react";
import { useT } from "@/lib/i18n/useI18n";

export default function RequirementsStep({
  onContinue,
}: {
  onContinue: () => void;
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
