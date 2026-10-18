"use client";

import type { ReactNode } from "react";
import RequirementsStep from "@/components/competitions/Registration/RequirementsStep";
import PaymentStep from "@/components/competitions/Registration/PaymentStep";
import { RegistrationStatus } from "@/components/competitions/Registration/RegistrationOverview";
import type { components } from "@/types/openapi";

type StepConfig = components["schemas"]["RegistrationConfig"];
type StepKey = StepConfig["key"];
type StepOf<K extends StepKey> = Extract<StepConfig, { key: K }>;
type CompetitionInfo = components["schemas"]["CompetitionInfo"];
type Registration = components["schemas"]["RegistrationDataV2"];

/**
 * Everything the lane knows, handed to every step. A step reads what it needs and ignores the rest,
 * so that adding a step is a matter of adding it below rather than of threading another prop
 * through the panel.
 */
export interface StepContext {
  competitionInfo: CompetitionInfo;
  registration: Registration | null;
  /** A registration that stands: submitted (or on its way) and not withdrawn. */
  hasRegistration: boolean;
  hasAcknowledgedRequirements: boolean;
  onAcknowledgedChange: (acknowledged: boolean) => void;
  hasAcceptedRequirements: boolean;
  onAcceptRequirements: () => void;
  isPaymentOutstanding: boolean;
  registrationForm: (onClose?: () => void) => ReactNode;
}

interface StepDefinition<K extends StepKey> {
  /**
   * Steps that ask something of the competitor before the rest of the flow opens up. The panel sits
   * on the first one that has not been passed yet, in whatever order the server sent them, and a
   * step is left behind by being done rather than by a Next button.
   *
   * A step without this is one the competitor only watches: payment and approval report what is
   * happening rather than asking for anything, so they never hold the flow up and say their piece
   * once it has been walked.
   */
  isPassed?: (context: StepContext) => boolean;
  Content: (props: { step: StepOf<K>; context: StepContext }) => ReactNode;
}

const STEP_DEFINITIONS: { [K in StepKey]: StepDefinition<K> } = {
  requirements: {
    isPassed: (context) =>
      context.hasAcceptedRequirements || context.hasRegistration,
    Content: ({ context }) => (
      <RequirementsStep
        hasAcknowledged={context.hasAcknowledgedRequirements}
        onAcknowledgedChange={context.onAcknowledgedChange}
        onContinue={context.onAcceptRequirements}
      />
    ),
  },
  competing: {
    isPassed: (context) => context.hasRegistration,
    Content: ({ context }) => context.registrationForm(),
  },
  payment: {
    Content: ({ step, context }) =>
      context.isPaymentOutstanding && (
        <PaymentStep
          competitionInfo={context.competitionInfo}
          registration={context.registration}
          deadline={step.deadline}
        />
      ),
  },
  approval: {
    Content: ({ context }) =>
      context.registration && (
        <RegistrationStatus registration={context.registration} />
      ),
  },
};

/** Whether the competitor has to get past this step before the rest of the flow opens up. */
export const isGatingStep = (step: StepConfig) =>
  STEP_DEFINITIONS[step.key].isPassed !== undefined;

/**
 * The step the competitor is on: the first gate they have not passed yet. Once there is none left
 * the flow is complete, which `Steps` reads as the index one past the end.
 */
export function activeStepIndex(steps: StepConfig[], context: StepContext) {
  const index = steps.findIndex(
    (step) => STEP_DEFINITIONS[step.key].isPassed?.(context) === false,
  );

  return index === -1 ? steps.length : index;
}

export function StepContent({
  step,
  context,
}: {
  step: StepConfig;
  context: StepContext;
}) {
  // Each definition is checked against its own step type, but TypeScript cannot see that a step and
  //   the definition looked up with that step's own key belong together (microsoft/TypeScript#30581),
  //   so the pairing is asserted here, once, rather than in every step that is handed its config.
  const { Content } = STEP_DEFINITIONS[step.key] as StepDefinition<StepKey>;

  return <Content step={step} context={context} />;
}
