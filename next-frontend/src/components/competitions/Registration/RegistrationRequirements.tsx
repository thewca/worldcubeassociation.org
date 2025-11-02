import { Alert, Box, Checkbox } from "@chakra-ui/react";
import { getT } from "@/lib/i18n/get18n";
import type { PanelProps } from "@/app/(wca)/competitions/[competitionId]/register/page";

async function RegistrationFullMessage({ competitionInfo }: PanelProps) {
  const { t } = await getT();

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

export default async function RegistrationRequirements({ competitionInfo }: PanelProps) {
  const { t } = await getT();

  return (
    <Box>
      <RegistrationFullMessage competitionInfo={competitionInfo} />
      <Checkbox.Root variant="solid">
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
    </Box>
  );
}
