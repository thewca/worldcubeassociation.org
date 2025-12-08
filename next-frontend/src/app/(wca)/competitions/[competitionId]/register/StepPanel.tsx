"use client"

import { Box, Button, ButtonGroup, Group, Steps } from "@chakra-ui/react";
import RequirementsStep from "@/components/competitions/Registration/RequirementsStep";
import type { components } from "@/types/openapi";
import { createFormHook, createFormHookContexts, formOptions } from "@tanstack/react-form";
import CompetingStep from "@/components/competitions/Registration/CompetingStep";
import { useT } from "@/lib/i18n/useI18n";
import StepSummary from "@/components/competitions/Registration/StepSummary";
import ApprovalStep from "@/components/competitions/Registration/ApprovalStep";
import { LuSend } from "react-icons/lu";
import type { UtilityValues } from "@/types/chakra/prop-types.gen";

type CompetitionInfo = components["schemas"]["CompetitionInfo"];
type StepConfig = components["schemas"]["RegistrationConfig"];
type StepKey = StepConfig["key"];

export const { fieldContext, formContext } =
  createFormHookContexts();

const { useAppForm, withForm } = createFormHook({
  fieldComponents: {},
  formComponents: {},
  fieldContext,
  formContext,
});

interface RegistrationDummy {
  hasAcceptedTerms: boolean;
  comment?: string;
  numberOfGuests: number;
  eventIds: string[];
}

const defaultRegistration: RegistrationDummy = {
  hasAcceptedTerms: false,
  numberOfGuests: 0,
  eventIds: [],
}

const regFormOptions = formOptions({
  defaultValues: defaultRegistration,
});

// The only reason why we have this custom hook is that we can infer its return type.
// Tanstack-Form is pretty powerful, but the price for this power is a nightmare in generics,
//   so type-casting the `form` component prop by ourselves is not an option.
// See also https://github.com/TanStack/form/discussions/1804 for reference.
const useRegistrationForm = () => useAppForm({ ...regFormOptions })
type RegistrationForm = ReturnType<typeof useRegistrationForm>;

export type PanelProps = { competitionInfo: CompetitionInfo, form: RegistrationForm };

const stepsFrontend = {
  requirements: RequirementsStep,
  competing: CompetingStep,
  payment: RequirementsStep,
  approval: ApprovalStep,
} satisfies Record<StepKey, React.ComponentType<PanelProps>>

const stepsCompleteness = {
  requirements: (reg) => reg.hasAcceptedTerms,
  competing: (reg) => reg.eventIds.length > 0,
  payment: (reg) => reg.hasAcceptedTerms,
  approval: (reg) => reg.hasAcceptedTerms,
} satisfies Record<StepKey, ((reg: RegistrationDummy) => boolean)>

type ColorPalette = UtilityValues["colorPalette"];
type NavButtonOverride = Partial<{
  colorPalette: ColorPalette,
  title: string,
  icon: React.ReactNode,
}>

const buttonOverrides: Partial<Record<StepKey, NavButtonOverride>> = {
  competing: {
    colorPalette: "green",
    title: "Submit",
    icon: <LuSend />,
  },
}

const StepPanelContents = ({
  steps,
  form,
  competitionInfo,
}: {
  steps: StepConfig[];
  form: RegistrationForm;
  competitionInfo: CompetitionInfo;
}) => {
  return steps.map((step, idx) => {
    const StepPanel = withForm({
      ...regFormOptions,
      props: {
        competitionInfo,
      },
      render: stepsFrontend[step.key],
    })

    return (
      <Steps.Content key={step.key} index={idx}>
        <StepPanel form={form} competitionInfo={competitionInfo} />
      </Steps.Content>
    );
  });
}

const StepPanel = ({
 steps,
 competitionInfo,
}: {
  steps: StepConfig[];
  competitionInfo: CompetitionInfo;
}) => {
  const { t } = useT();

  const registrationForm = useRegistrationForm();

  return (
    <Steps.Root count={steps.length} colorPalette="blue" linear>
      <Steps.List>
        {steps.map((step, idx) => {
          const stepTranslationLookup = `competitions.registration_v2.register.panel.${step.key}`;
          const stepTitle = t(`${stepTranslationLookup}.title`)

          return (
            <Steps.Item key={step.key} index={idx} title={stepTitle}>
              <Steps.Trigger disabled={!step.isEditable}>
                <Steps.Indicator />
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

      <StepPanelContents steps={steps} form={registrationForm} competitionInfo={competitionInfo} />

      <Steps.CompletedContent>
        <StepSummary form={registrationForm} competitionInfo={competitionInfo} />
      </Steps.CompletedContent>

      <ButtonGroup size="sm" variant="surface" asChild>
        <Group grow>
          {/*
            <Steps.PrevTrigger asChild>
              <Button>Prev</Button>
            </Steps.PrevTrigger>
          */}
          <Steps.Context>
            {(ctx) => {
              if (ctx.isCompleted) return null;

              const currentStepKey = steps[ctx.value].key;
              const completionFn = stepsCompleteness[currentStepKey];

              return (
                <registrationForm.Subscribe selector={(state) => completionFn(state.values)}>
                  {(isComplete) => {
                    const buttonConfig = buttonOverrides[currentStepKey];

                    return (
                      <Steps.NextTrigger asChild>
                        <Button
                          disabled={!isComplete}
                          colorPalette={buttonConfig?.colorPalette}
                        >
                          {buttonConfig?.icon}
                          {buttonConfig?.title ?? "Next"}
                        </Button>
                      </Steps.NextTrigger>
                    );
                  }}
                </registrationForm.Subscribe>
              );
            }}
          </Steps.Context>
        </Group>
      </ButtonGroup>
    </Steps.Root>
  );
}

export default StepPanel;
