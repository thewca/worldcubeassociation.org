"use client";

import { Alert, Button, Checkbox, Steps, VStack } from "@chakra-ui/react";
import { useState } from "react";
import { useT } from "@/lib/i18n/useI18n";

export default function RequirementsStep() {
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
      <Steps.NextTrigger asChild>
        <Button width="full" disabled={!hasAcknowledged} colorPalette="blue">
          {t("competitions.registration_v2.requirements.accept")}
        </Button>
      </Steps.NextTrigger>
    </VStack>
  );
}
