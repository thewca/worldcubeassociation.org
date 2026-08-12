"use client";

import { Box, Steps } from "@chakra-ui/react";
import RequirementsStep from "@/components/competitions/Registration/RequirementsStep";
import type { components } from "@/types/openapi";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import CompetingStep from "@/components/competitions/Registration/CompetingStep";
import PaymentStep from "@/components/competitions/Registration/PaymentStep";
import RegistrationOverview from "@/components/competitions/Registration/RegistrationOverview";
import { useT } from "@/lib/i18n/useI18n";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import useAPI, { useAPIClient } from "@/lib/wca/useAPI";
import { toaster } from "@/components/ui/toaster";

type CompetitionInfo = components["schemas"]["CompetitionInfo"];
type StepConfig = components["schemas"]["RegistrationConfig"];
type StepKey = StepConfig["key"];
type Registration = components["schemas"]["RegistrationDataV2"];

// How often we ask the backend whether the registration job has finished.
const REGISTRATION_POLL_INTERVAL_MS = 2000;

export const { fieldContext, formContext } = createFormHookContexts();

const { useAppForm } = createFormHook({
  fieldComponents: {},
  formComponents: {},
  fieldContext,
  formContext,
});

export interface RegistrationFormValues {
  comment: string;
  guests: number;
  eventIds: string[];
}

// The only reason why we have this custom hook is that we can infer its return type.
// Tanstack-Form is pretty powerful, but the price for this power is a nightmare in generics,
//   so type-casting the `form` component prop by ourselves is not an option.
// See also https://github.com/TanStack/form/discussions/1804 for reference.
const useRegistrationForm = (defaultValues: RegistrationFormValues) =>
  useAppForm({ defaultValues });

export type RegistrationForm = ReturnType<typeof useRegistrationForm>;

const registrationFormValues = (
  registration: Registration | null,
): RegistrationFormValues => ({
  comment: registration?.competing.comment ?? "",
  guests: registration?.guests ?? 0,
  eventIds: registration?.competing.event_ids ?? [],
});

export default function StepPanel({
  steps,
  competitionInfo,
  userId,
  initialRegistration,
}: {
  steps: StepConfig[];
  competitionInfo: CompetitionInfo;
  userId: number;
  initialRegistration: Registration | null;
}) {
  const { t } = useT();

  const api = useAPI();
  const apiClient = useAPIClient();
  const queryClient = useQueryClient();

  const [hasAcknowledgedRequirements, setHasAcknowledgedRequirements] =
    useState(false);

  // `undefined` means "show whatever step the registration still needs". Picking a step from the
  //   stepper pins it, until the next successful submission hands control back to the registration.
  const [pinnedStep, setPinnedStep] = useState<number>();

  const registrationQueryKey = ["registration", competitionInfo.id, userId];

  const showRegistrationError = (payload: { error: number }) =>
    toaster.create({
      id: "registration-error",
      type: "error",
      description: t(`competitions.registration_v2.errors.${payload.error}`, {
        defaultValue: t("competitions.registration_v2.errors.-4"),
      }),
    });

  const createRegistration = api.useMutation(
    "post",
    "/v1/competitions/{competitionId}/registrations",
    {
      onError: showRegistrationError,
      // Creation is queued in the background, so there is no registration to store yet -
      //   the query below polls until the job has produced one.
      onSuccess: () => setPinnedStep(undefined),
    },
  );

  const updateRegistration = api.useMutation(
    "patch",
    "/v1/registrations/{registrationId}",
    {
      onError: showRegistrationError,
      onSuccess: (data) => {
        queryClient.setQueryData(registrationQueryKey, data.registration);
        setPinnedStep(undefined);
        toaster.create({
          id: "registration-updated",
          type: "success",
          description: t("registrations.flash.updated"),
        });
      },
    },
  );

  const { data: registration } = useQuery({
    queryKey: registrationQueryKey,
    queryFn: async () => {
      const { data, error, response } = await apiClient.GET(
        "/v1/competitions/{competitionId}/registrations/{userId}",
        { params: { path: { competitionId: competitionInfo.id, userId } } },
      );

      // Not being registered is a normal answer rather than a failure, so it must not reject:
      //   after creating a registration we poll this query until the background job is done.
      if (response.status === 404) {
        return null;
      }

      if (error) {
        throw error;
      }

      return data;
    },
    initialData: initialRegistration,
    refetchInterval: (query) =>
      createRegistration.isSuccess && query.state.data === null
        ? REGISTRATION_POLL_INTERVAL_MS
        : false,
  });

  // The create endpoint only queues a job, so the submission is not finished until the poll above
  //   has actually found the registration it produced.
  const isAwaitingCreation =
    createRegistration.isSuccess && registration === null;

  const form = useRegistrationForm(registrationFormValues(registration));

  const competingStatus = registration?.competing.registration_status;
  const isRegistered = registration !== null && competingStatus !== "cancelled";

  const isStepComplete: Record<StepKey, boolean> = {
    requirements: hasAcknowledgedRequirements || isRegistered,
    competing: isRegistered,
    payment: registration?.payment?.has_paid ?? false,
    approval: competingStatus === "accepted",
  };

  const firstIncompleteStep = steps.findIndex(
    (step) => !isStepComplete[step.key],
  );
  // Once every step is done there is no incomplete one to show, and `Steps` treats an index of
  //   `count` as "the whole flow is completed".
  const furthestOpenStep =
    firstIncompleteStep === -1 ? steps.length : firstIncompleteStep;
  const activeStep = pinnedStep ?? furthestOpenStep;

  const submitRegistration = ({
    comment,
    guests,
    eventIds,
  }: RegistrationFormValues) => {
    const competing = { event_ids: eventIds, comment };

    if (registration === null) {
      createRegistration.mutate({
        params: { path: { competitionId: competitionInfo.id } },
        body: { user_id: userId, guests, competing },
      });
      return;
    }

    updateRegistration.mutate({
      params: { path: { registrationId: registration.id } },
      body: {
        guests,
        competing: {
          ...competing,
          // Registering again after withdrawing means moving back to `pending` for approval.
          ...(competingStatus === "cancelled" && {
            status: "pending" as const,
          }),
        },
      },
    });
  };

  const stepContent = (step: StepConfig) => {
    switch (step.key) {
      case "requirements":
        return (
          <RequirementsStep
            competitionInfo={competitionInfo}
            hasAcknowledged={hasAcknowledgedRequirements}
            onAcknowledgedChange={setHasAcknowledgedRequirements}
            onContinue={() => setPinnedStep(activeStep + 1)}
          />
        );
      case "competing":
        return (
          <CompetingStep
            form={form}
            competitionInfo={competitionInfo}
            parameters={step.parameters}
            registration={registration}
            isSubmitting={
              createRegistration.isPending ||
              updateRegistration.isPending ||
              isAwaitingCreation
            }
            onSubmit={submitRegistration}
          />
        );
      case "payment":
        return (
          <PaymentStep
            competitionInfo={competitionInfo}
            registration={registration}
            deadline={step.deadline}
          />
        );
      case "approval":
        return (
          <RegistrationOverview
            competitionInfo={competitionInfo}
            registration={registration}
          />
        );
    }
  };

  return (
    <Steps.Root
      count={steps.length}
      colorPalette="blue"
      step={activeStep}
      onStepChange={({ step }) => setPinnedStep(step)}
    >
      <Steps.List>
        {steps.map((step, index) => {
          const stepTranslationLookup = `competitions.registration_v2.register.panel.${step.key}`;
          const stepTitle = t(`${stepTranslationLookup}.title`);

          // A step can be revisited while it is still open for changes, but steps beyond the one
          //   that needs attention are locked until the earlier ones are done.
          const isDisabled =
            index > furthestOpenStep ||
            (isStepComplete[step.key] && !step.isEditable);

          return (
            <Steps.Item key={step.key} index={index} title={stepTitle}>
              <Steps.Trigger disabled={isDisabled}>
                <Steps.Indicator />
                <Box>
                  <Steps.Title>{stepTitle}</Steps.Title>
                  <Steps.Description>
                    {t(`${stepTranslationLookup}.description`)}
                  </Steps.Description>
                </Box>
              </Steps.Trigger>
              <Steps.Separator />
            </Steps.Item>
          );
        })}
      </Steps.List>

      {steps.map((step, index) => (
        <Steps.Content key={step.key} index={index}>
          {stepContent(step)}
        </Steps.Content>
      ))}

      <Steps.CompletedContent>
        <RegistrationOverview
          competitionInfo={competitionInfo}
          registration={registration}
        />
      </Steps.CompletedContent>
    </Steps.Root>
  );
}
