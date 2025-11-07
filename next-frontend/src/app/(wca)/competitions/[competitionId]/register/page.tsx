import { auth } from "@/auth";
import {Alert, Box, Button, ButtonGroup, Card, HStack, Steps, VStack} from "@chakra-ui/react";
import { cache } from "react";
import { serverClientWithToken } from "@/lib/wca/wcaAPI";
import { getT } from "@/lib/i18n/get18n";
import type { components } from "@/types/openapi";
import StepPanelContents from "@/app/(wca)/competitions/[competitionId]/register/StepPanelContents";
import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";
import {RegistrationCard} from "@/components/competitions/Cards";
import RegistrationRequirementsCard
  from "@/app/(wca)/competitions/[competitionId]/register/RegistrationRequirementsCard";

const fetchConfig = cache(async (authToken: string, competitionId: string) => {
  const client = serverClientWithToken(authToken);

  return await client.GET("/v1/competitions/{competitionId}/registration_config", {
    params: { path: { competitionId } }
  })
});

type StepKey = components["schemas"]["RegistrationConfig"]["key"] | "approval";

type Step = { key: StepKey, isEditable: boolean };

export default async function RegisterPage({
  params
}: {
  params: Promise<{ competitionId: string }>
}) {
  const { t } = await getT();
  const session = await auth();

  if (session === null) {
    return (
      <Alert.Root>
        <Alert.Indicator />
        <Alert.Content>You need to log in first</Alert.Content>
      </Alert.Root>
    );
  }

  const competitionId = (await params).competitionId;

  const competitionInfoResponse = await getCompetitionInfo(competitionId);

  if (competitionInfoResponse.error) {
    return "Something went wrong: The competition does not exist"
  }

  const competitionInfo = competitionInfoResponse.data;

  // @ts-expect-error TODO: Fix this
  const stepConfig = await fetchConfig(session.accessToken, competitionId);

  if (stepConfig.error) {
    return "Something went wrong while fetching"
  }

  const steps = [
    ...stepConfig.data,
    { key: 'approval', isEditable: false }
  ] satisfies Step[];

  return (
    <VStack>
      <Box width="full">
        <RegistrationRequirementsCard competitionInfo={competitionInfo} />
      </Box>
      <Card.Root coloredBg width="full">
        <Card.Body>
          <Steps.Root count={steps.length}>
            <Steps.List>
              {steps.map((step, idx) => {
                const stepTranslationLookup = `competitions.registration_v2.register.panel.${step.key}`;
                const stepTitle = t(`${stepTranslationLookup}.title`)

                return (
                  <Steps.Item key={step.key} index={idx} title={stepTitle}>
                    <Steps.Trigger disabled={!step.isEditable}>
                      <Steps.Indicator/>
                      <Box>
                        <Steps.Title>{stepTitle}</Steps.Title>
                        <Steps.Description>{t(`${stepTranslationLookup}.description`)}</Steps.Description>
                      </Box>
                    </Steps.Trigger>
                    <Steps.Separator/>
                  </Steps.Item>
                );
              })}
            </Steps.List>

            <StepPanelContents steps={steps} competitionInfo={competitionInfo} />

            <ButtonGroup size="sm" variant="outline">
              <Steps.PrevTrigger asChild>
                <Button>Prev</Button>
              </Steps.PrevTrigger>
              <Steps.NextTrigger asChild>
                <Button>Next</Button>
              </Steps.NextTrigger>
            </ButtonGroup>
          </Steps.Root>
        </Card.Body>
      </Card.Root>
    </VStack>
  );
}
