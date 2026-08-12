"use client";

import { Alert, Button, Checkbox, VStack } from "@chakra-ui/react";
import { useT } from "@/lib/i18n/useI18n";
import type { components } from "@/types/openapi";

type CompetitionInfo = components["schemas"]["CompetitionInfo"];

function RegistrationFullMessage({
  competitionInfo,
}: {
  competitionInfo: CompetitionInfo;
}) {
  const { t } = useT();

  if (competitionInfo["registration_full_and_accepted?"]) {
    return (
      <Alert.Root status="warning">
        <Alert.Indicator />
        <Alert.Title>
          {t("registrations.registration_full", {
            competitor_limit: competitionInfo.competitor_limit,
          })}
        </Alert.Title>
      </Alert.Root>
    );
  }

  if (competitionInfo["registration_full?"]) {
    return (
      <Alert.Root status="warning">
        <Alert.Indicator />
        <Alert.Title>
          {t("registrations.registration_full_include_waiting_list", {
            competitor_limit: competitionInfo.competitor_limit,
          })}
        </Alert.Title>
      </Alert.Root>
    );
  }

  return null;
}

export default function RequirementsStep({
  competitionInfo,
  hasAcknowledged,
  onAcknowledgedChange,
  onContinue,
}: {
  competitionInfo: CompetitionInfo;
  hasAcknowledged: boolean;
  onAcknowledgedChange: (acknowledged: boolean) => void;
  onContinue: () => void;
}) {
  const { t } = useT();

  return (
    <VStack gap={3}>
      <RegistrationFullMessage competitionInfo={competitionInfo} />
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
        {t("competitions.registration_v2.requirements.next_step")}
      </Button>
    </VStack>
  );
}
