import { auth } from "@/auth";
import { Alert, Box, Button, ButtonGroup, Steps } from "@chakra-ui/react";
import { cache } from "react";
import { serverClientWithToken } from "@/lib/wca/wcaAPI";
import { getT } from "@/lib/i18n/get18n";
import type { components } from "@/types/openapi";
import RegistrationRequirements from "@/components/competitions/Registration/RegistrationRequirements";
import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";

const fetchConfig = cache(async (authToken: string, competitionId: string) => {
  const client = serverClientWithToken(authToken);

  return await client.GET("/v1/competitions/{competitionId}/registration_config", {
    params: { path: { competitionId } }
  })
});

type CompetitionInfo = components["schemas"]["CompetitionInfo"];
type StepKey = components["schemas"]["RegistrationConfig"]["key"] | "approval";

type Step = { key: StepKey, isEditable: boolean };

export type PanelProps = { competitionInfo: CompetitionInfo };

const stepsFrontend = {
  requirements: RegistrationRequirements,
  competing: RegistrationRequirements,
  payment: RegistrationRequirements,
  approval: RegistrationRequirements,
} satisfies Record<StepKey, React.ComponentType<PanelProps>>

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

  const stepConfig = await fetchConfig(session.accessToken, competitionId);

  if (stepConfig.error) {
    return "Something went wrong while fetching"
  }

  const steps = [
    ...stepConfig.data,
    { key: 'approval', isEditable: false }
  ] satisfies Step[];

  return (
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

      {steps.map((step, idx) => {
        const StepFrontend = stepsFrontend[step.key];

        return (
          <Steps.Content key={step.key} index={idx}>
            {StepFrontend && <StepFrontend competitionInfo={competitionInfo} />}
          </Steps.Content>
        );
      })}

      <ButtonGroup size="sm" variant="outline">
        <Steps.PrevTrigger asChild>
          <Button>Prev</Button>
        </Steps.PrevTrigger>
        <Steps.NextTrigger asChild>
          <Button>Next</Button>
        </Steps.NextTrigger>
      </ButtonGroup>
    </Steps.Root>
  );
}
