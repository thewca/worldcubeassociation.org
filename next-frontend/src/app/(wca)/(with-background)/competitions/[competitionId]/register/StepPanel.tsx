"use client";

import { Steps, VStack } from "@chakra-ui/react";
import RequirementsStep from "@/components/competitions/Registration/RequirementsStep";
import type { components } from "@/types/openapi";
import CompetingStep from "@/components/competitions/Registration/CompetingStep";
import PaymentStep from "@/components/competitions/Registration/PaymentStep";
import RegistrationOverview, {
  RegistrationStatus,
} from "@/components/competitions/Registration/RegistrationOverview";
import { useT } from "@/lib/i18n/useI18n";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import useAPI from "@/lib/wca/useAPI";
import { toaster } from "@/components/ui/toaster";
import pollRegistrationQueue from "@/lib/wca/registrations/pollRegistrationQueue";
import canEditRegistration from "@/lib/wca/registrations/canEditRegistration";
import useRegistration, {
  registrationQueryKey,
} from "@/lib/wca/registrations/useRegistration";
import {
  registrationFormValues,
  useRegistrationForm,
  type RegistrationFormValues,
} from "@/lib/wca/registrations/registrationForm";

type CompetitionInfo = components["schemas"]["CompetitionInfo"];
type StepConfig = components["schemas"]["RegistrationConfig"];
type Registration = components["schemas"]["RegistrationDataV2"];

// How often we ask the queue whether it has worked off our submission yet.
const QUEUE_POLL_INTERVAL_MS = 3000;
// Once the queue says it is done, how often we ask Rails for the registration it produced.
const REGISTRATION_REFETCH_INTERVAL_MS = 1000;

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

  // Every lane the backend builds is a lane for registering, so it always carries a competing step -
  //   the panel has nothing to show without one.
  const competingParameters = steps.find(
    (step) => step.key === "competing",
  )!.parameters;

  const api = useAPI();
  const queryClient = useQueryClient();

  const [hasAcknowledgedRequirements, setHasAcknowledgedRequirements] =
    useState(false);

  // Kept apart from the acknowledgement itself: ticking the box would otherwise swap the panel out
  //   from under the competitor before they ever reach the Continue button.
  const [hasStartedRegistering, setHasStartedRegistering] = useState(false);

  const [isEditing, setIsEditing] = useState(false);

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
    { onError: showRegistrationError },
  );

  // Editing a registration and withdrawing from one are the same PATCH, so they share the mutation:
  //   what they have in common lives here, and each action adds its own outcome where it is called.
  const patchRegistration = api.useMutation(
    "patch",
    "/v1/registrations/{registrationId}",
    {
      onError: showRegistrationError,
      onSuccess: (data) => {
        queryClient.setQueryData(
          registrationQueryKey(competitionInfo.id, userId),
          data.registration,
        );
        setIsEditing(false);
      },
    },
  );

  const updateRegistration = (
    current: Registration,
    { comment, guests, eventIds }: RegistrationFormValues,
  ) =>
    patchRegistration.mutate(
      {
        params: { path: { registrationId: current.id } },
        body: {
          guests,
          competing: {
            event_ids: eventIds,
            comment,
            // Registering again after withdrawing means moving back to `pending` for approval.
            ...(current.competing.registration_status === "cancelled" && {
              status: "pending",
            }),
          },
        },
      },
      {
        onSuccess: () =>
          toaster.create({
            id: "registration-updated",
            type: "success",
            description: t("registrations.flash.updated"),
          }),
      },
    );

  const cancelRegistration = (registrationId: number) =>
    patchRegistration.mutate(
      {
        params: { path: { registrationId } },
        body: { competing: { status: "cancelled" } },
      },
      {
        onSuccess: () => {
          // Signing up again starts at the requirements, not where the competitor left off.
          setHasStartedRegistering(false);
          toaster.create({
            id: "registration-cancelled",
            type: "success",
            description: t(
              "competitions.registration_v2.register.registration_status.cancelled",
            ),
          });
        },
      },
    );

  // One mutation serves both actions, so which of the two is in flight is told by what is being
  //   sent - and each button only spins for its own action.
  const isCancelling =
    patchRegistration.isPending &&
    patchRegistration.variables?.body.competing?.status === "cancelled";

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

  const registration = useRegistration({
    competitionId: competitionInfo.id,
    userId,
    initialRegistration,
    // Only once the queue reports it is finished do we go and collect the registration itself.
    refetchInterval: (current) =>
      createRegistration.isSuccess && isQueueDone && current === null
        ? REGISTRATION_REFETCH_INTERVAL_MS
        : false,
  });

  // The create endpoint only queues a job, so the submission is not finished until the queue has
  //   worked it off and Rails has handed us the registration it produced.
  const isAwaitingCreation =
    createRegistration.isSuccess && registration === null;

  const submitRegistration = ({
    comment,
    guests,
    eventIds,
  }: RegistrationFormValues) => {
    if (registration === null) {
      createRegistration.mutate({
        params: { path: { competitionId: competitionInfo.id } },
        body: {
          user_id: userId,
          guests,
          competing: { event_ids: eventIds, comment },
        },
      });
    } else {
      updateRegistration(registration, { comment, guests, eventIds });
    }
  };

  const form = useRegistrationForm({
    registration,
    parameters: competingParameters,
    onSubmit: submitRegistration,
  });

  // Reset on the way in rather than on the way out, so that the form the competitor opens always
  //   starts from what is currently saved - and `isDefaultValue` means "nothing changed yet".
  const startEditing = (editing: boolean) => {
    if (editing) {
      form.reset(registrationFormValues(registration, competingParameters));
    }

    setIsEditing(editing);
  };

  // `onClose` only where there is a summary to go back to, which is what tells the form it may
  //   offer a way out of itself.
  const registrationForm = (onClose?: () => void) => (
    <CompetingStep
      competitionInfo={competitionInfo}
      parameters={competingParameters}
      registration={registration}
      form={form}
      isSubmitting={
        createRegistration.isPending ||
        (patchRegistration.isPending && !isCancelling) ||
        isAwaitingCreation
      }
      onClose={onClose}
    />
  );

  // Withdrawing puts the competitor back at the start: signing up again means going through the
  //   requirements and, where there is a fee, paying it - so they get the whole flow back rather
  //   than a summary of a registration that no longer stands.
  const hasWithdrawn =
    registration?.competing.registration_status === "cancelled";

  // Registering is the only thing the stepper is for. Once there is a registration that stands -
  //   even a rejected one - the overview takes over, and everything still outstanding is said
  //   there rather than by a strip of circles.
  if ((registration !== null && !hasWithdrawn) || isAwaitingCreation) {
    // Only a registration still waiting for approval has a fee to chase: organizers accepting or
    //   waitlisting someone settles the question - their fee has been waived, or is being
    //   collected some other way - and a withdrawn or rejected competitor owes nothing at all.
    const paymentStep = steps.find((step) => step.key === "payment");

    const isPaymentOutstanding =
      registration !== null &&
      registration.competing.registration_status === "pending" &&
      !registration.payment?.has_paid;

    return (
      <VStack width="full" gap="4" align="stretch">
        {isPaymentOutstanding && paymentStep && (
          <PaymentStep
            competitionInfo={competitionInfo}
            registration={registration}
            deadline={paymentStep.deadline}
          />
        )}
        <RegistrationOverview
          competitionInfo={competitionInfo}
          registration={registration}
          queueCount={queueStatus?.queue_count}
          canEdit={
            registration !== null &&
            canEditRegistration(competingParameters, registration)
          }
          isEditing={isEditing}
          onEditingChange={startEditing}
          isCancelling={isCancelling}
          onCancel={cancelRegistration}
        >
          {registrationForm(() => setIsEditing(false))}
        </RegistrationOverview>
      </VStack>
    );
  }

  // Before there is a registration the flow is strictly linear, so `Steps` can derive everything
  //   it shows from the position of the step the competitor is on.
  const requirementsStepIndex = steps.findIndex(
    (step) => step.key === "requirements",
  );
  const competingStepIndex = steps.findIndex(
    (step) => step.key === "competing",
  );

  return (
    <VStack width="full" gap="4" align="stretch">
      {registration !== null && (
        <RegistrationStatus registration={registration} />
      )}
      <Steps.Root
        count={steps.length}
        colorPalette="blue"
        step={
          hasStartedRegistering ? competingStepIndex : requirementsStepIndex
        }
        // Four labelled steps do not fit side by side on a phone, so there they become one step per
        //   row. `flexDirection` because the vertical variant otherwise puts the strip beside the
        //   panel rather than above it, which is even narrower.
        orientation={{ base: "vertical", lg: "horizontal" }}
        flexDirection="column"
        gap="8"
      >
        {/* Purely a map of what is coming: payment and approval are reached by registering, not by
          clicking ahead, so the steps are shown rather than offered as navigation. */}
        <Steps.List>
          {steps.map((step, index) => {
            const translationKey = `competitions.registration_v2.register.panel.${step.key}`;

            return (
              <Steps.Item key={step.key} index={index}>
                <Steps.Indicator />
                <VStack gap="0" alignItems="start" minWidth="0">
                  <Steps.Title>{t(`${translationKey}.title`)}</Steps.Title>
                  <Steps.Description>
                    {t(`${translationKey}.description`)}
                  </Steps.Description>
                </VStack>
                <Steps.Separator />
              </Steps.Item>
            );
          })}
        </Steps.List>

        <Steps.Content index={requirementsStepIndex}>
          <RequirementsStep
            hasAcknowledged={hasAcknowledgedRequirements}
            onAcknowledgedChange={setHasAcknowledgedRequirements}
            onContinue={() => setHasStartedRegistering(true)}
          />
        </Steps.Content>

        <Steps.Content index={competingStepIndex}>
          {registrationForm()}
        </Steps.Content>
      </Steps.Root>
    </VStack>
  );
}
