"use client"

import {Code, Steps} from "@chakra-ui/react";
import RegistrationRequirements from "@/components/competitions/Registration/RegistrationRequirements";
import type { components } from "@/types/openapi";
import { createFormHook, createFormHookContexts, formOptions } from "@tanstack/react-form";

type CompetitionInfo = components["schemas"]["CompetitionInfo"];
type StepKey = components["schemas"]["RegistrationConfig"]["key"] | "approval";

type Step = { key: StepKey, isEditable: boolean };

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
}

const defaultRegistration: RegistrationDummy = {
  hasAcceptedTerms: false,
}

const regFormOptions = formOptions({
  defaultValues: defaultRegistration,
});

const useRegistrationForm = () => useAppForm({ ...regFormOptions })
type RegistrationForm = ReturnType<typeof useRegistrationForm>;

export type PanelProps = { competitionInfo: CompetitionInfo, form: RegistrationForm };

const stepsFrontend = {
  requirements: RegistrationRequirements,
  competing: RegistrationRequirements,
  payment: RegistrationRequirements,
  approval: RegistrationRequirements,
} satisfies Record<StepKey, React.ComponentType<PanelProps>>

const StepPanelContents = ({
  steps,
  competitionInfo,
}: {
  steps: Step[];
  competitionInfo: CompetitionInfo;
}) => {
  const registrationForm = useRegistrationForm();

  return (
    <>
      {steps.map((step, idx) => {
        const StepPanel = withForm({
          ...regFormOptions,
          props: {
            competitionInfo,
          },
          render: stepsFrontend[step.key],
        })

        return (
          <Steps.Content key={step.key} index={idx}>
            <StepPanel form={registrationForm} competitionInfo={competitionInfo} />
          </Steps.Content>
        );
      })}
      <registrationForm.Subscribe selector={(state) => state.values.hasAcceptedTerms}>
        {(hasAccepted) => <Code>{hasAccepted.toString()}</Code>}
      </registrationForm.Subscribe>
    </>
  );
}

export default StepPanelContents;
