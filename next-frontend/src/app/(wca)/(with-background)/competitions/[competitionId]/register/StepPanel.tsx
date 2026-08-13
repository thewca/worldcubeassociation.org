"use client";

import { Steps } from "@chakra-ui/react";
import RequirementsStep from "@/components/competitions/Registration/RequirementsStep";
import StepList from "@/components/competitions/Registration/StepList";
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
import pollRegistrationQueue from "@/lib/wca/registrations/pollRegistrationQueue";

type CompetitionInfo = components["schemas"]["CompetitionInfo"];
type StepConfig = components["schemas"]["RegistrationConfig"];
type StepKey = StepConfig["key"];
type Registration = components["schemas"]["RegistrationDataV2"];

// How often we ask the queue whether it has worked off our submission yet.
const QUEUE_POLL_INTERVAL_MS = 3000;
// Once the queue says it is done, how often we ask Rails for the registration it produced.
const REGISTRATION_REFETCH_INTERVAL_MS = 1000;

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
  // `null` rather than `undefined` for "not registered": react-query reads `initialData:
  //   undefined` as "no initial data" and refetches on mount, throwing away the server fetch.
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
      // Creation is queued, so there is no registration to store yet - the queue poll below
      //   takes over from here.
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

  // Creating a registration only puts it on a queue, and the queue - not Rails - is what knows
  //   whether it has been worked off yet, so that is what we wait on.
  const { data: queueStatus } = useQuery({
    queryKey: ["registration-queue", competitionInfo.id, userId],
    queryFn: () => pollRegistrationQueue(competitionInfo.id, userId),
    enabled: createRegistration.isSuccess,
    refetchInterval: (query) =>
      query.state.data?.processing === false ? false : QUEUE_POLL_INTERVAL_MS,
  });

  const isQueueDone = queueStatus?.processing === false;

  const { data: registration } = useQuery({
    queryKey: registrationQueryKey,
    queryFn: async () => {
      const { data, error, response } = await apiClient.GET(
        "/v1/competitions/{competitionId}/registrations/{userId}",
        { params: { path: { competitionId: competitionInfo.id, userId } } },
      );

      // Not being registered is a normal answer rather than a failure, so it must not reject.
      if (response.status === 404) {
        return null;
      }

      if (error) {
        throw error;
      }

      return data;
    },
    initialData: initialRegistration,
    // Only once the queue reports it is finished do we go and collect the registration itself.
    refetchInterval: (query) =>
      createRegistration.isSuccess && isQueueDone && query.state.data === null
        ? REGISTRATION_REFETCH_INTERVAL_MS
        : false,
  });

  // The create endpoint only queues a job, so the submission is not finished until the queue has
  //   worked it off and Rails has handed us the registration it produced.
  const isAwaitingCreation =
    createRegistration.isSuccess && registration === null;

  const form = useRegistrationForm(registrationFormValues(registration));

  const competingStatus = registration?.competing.registration_status;
  const isRejected = competingStatus === "rejected";
  const isAccepted = competingStatus === "accepted";
  const isWaitlisted = competingStatus === "waiting_list";
  const isRegistered = registration !== null && competingStatus !== "cancelled";

  const isStepComplete: Record<StepKey, boolean> = {
    requirements: hasAcknowledgedRequirements || isRegistered,
    competing: isRegistered,
    // Organizers accepting or waitlisting someone settles the payment question for the purposes
    //   of navigation: their fee has been waived, or is being collected some other way.
    payment:
      (registration?.payment?.has_paid ?? false) || isAccepted || isWaitlisted,
    approval: isAccepted,
  };

  const firstIncompleteStep = steps.findIndex(
    (step) => !isStepComplete[step.key],
  );
  // Once every step is done there is no incomplete one to show, and `Steps` treats an index of
  //   `count` as "the whole flow is completed".
  const furthestOpenStep =
    firstIncompleteStep === -1 ? steps.length : firstIncompleteStep;

  // A rejected competitor is sent straight to the outcome, since it is the only step they may see.
  const approvalStep = steps.findIndex((step) => step.key === "approval");
  const defaultStep =
    isRejected && approvalStep !== -1 ? approvalStep : furthestOpenStep;

  const activeStep = pinnedStep ?? defaultStep;

  const isStepDisabled = (step: StepConfig, index: number) => {
    // A rejected competitor has nothing left to do but read the outcome.
    if (isRejected) {
      return step.key !== "approval";
    }

    // Approval doubles as the registration summary, so it is reachable as soon as there is a
    //   registration to summarise - including before paying, so that competitors can check and
    //   correct their events first.
    if (step.key === "approval") {
      return !isRegistered;
    }

    if (index === activeStep) {
      return false;
    }

    if (index < activeStep) {
      const earlierStepIncomplete = steps
        .slice(0, index)
        .some((earlier) => !isStepComplete[earlier.key]);

      return (
        (isStepComplete[step.key] && !step.isEditable) || earlierStepIncomplete
      );
    }

    // Still ahead of the competitor: only reachable if they are done with it and may revise it.
    return !(isStepComplete[step.key] && step.isEditable);
  };

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
            queueCount={queueStatus?.queue_count}
          />
        );
    }
  };

  return (
    // `Steps` is kept only for switching panels: it decides which `Content` is visible from
    //   `step`, and shows `CompletedContent` once that reaches `count`. Navigation and the step
    //   strip itself are ours, because the machine's notion of "complete" is positional.
    <Steps.Root
      count={steps.length}
      colorPalette="blue"
      step={activeStep}
      gap="8"
    >
      <StepList
        steps={steps}
        activeStep={activeStep}
        isStepComplete={isStepComplete}
        isStepDisabled={isStepDisabled}
        onStepSelect={setPinnedStep}
      />

      {steps.map((step, index) => (
        <Steps.Content key={step.key} index={index}>
          {stepContent(step)}
        </Steps.Content>
      ))}

      <Steps.CompletedContent>
        <RegistrationOverview
          competitionInfo={competitionInfo}
          registration={registration}
          queueCount={queueStatus?.queue_count}
        />
      </Steps.CompletedContent>
    </Steps.Root>
  );
}
