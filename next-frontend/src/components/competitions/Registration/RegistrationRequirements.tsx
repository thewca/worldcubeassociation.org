"use client"

import {Alert, Box, Checkbox, VStack} from "@chakra-ui/react";
import { useT } from "@/lib/i18n/useI18n";
import { PanelProps } from "@/app/(wca)/competitions/[competitionId]/register/StepPanel";

function RegistrationFullMessage({ competitionInfo }: Pick<PanelProps, "competitionInfo">) {
  const { t } = useT();

  if (competitionInfo['registration_full_and_accepted?']) {
    return (
      <Alert.Root status="warning">
        <Alert.Indicator />
        <Alert.Title>
          {t('registrations.registration_full', { competitor_limit: competitionInfo.competitor_limit })}
        </Alert.Title>
      </Alert.Root>
    );
  }

  if (competitionInfo['registration_full?']) {
    return (
      <Alert.Root status="warning">
        <Alert.Indicator />
        <Alert.Title>
          {t('registrations.registration_full_include_waiting_list', { competitor_limit: competitionInfo.competitor_limit })}
        </Alert.Title>
      </Alert.Root>
    );
  }

  return null;
}

export default function RegistrationRequirements({ form, competitionInfo }: PanelProps) {
  const { t } = useT();

  return (
    <VStack gap={3}>
      <RegistrationFullMessage competitionInfo={competitionInfo} />
      <form.Field name="hasAcceptedTerms">
        {(field) => (
          <Checkbox.Root
            variant="solid"
            width="full"
            checked={field.state.value}
            onCheckedChange={(e) => field.handleChange(!!e.checked)}
          >
            <Checkbox.HiddenInput />
            <Alert.Root status="success">
              <Alert.Indicator>
                <Checkbox.Control />
              </Alert.Indicator>
              <Alert.Title asChild>
                <Checkbox.Label>{t('competitions.registration_v2.requirements.acknowledgement')}</Checkbox.Label>
              </Alert.Title>
            </Alert.Root>
          </Checkbox.Root>
        )}
      </form.Field>
    </VStack>
  );
}
