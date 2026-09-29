"use client";

import { Steps, VStack } from "@chakra-ui/react";
import type { components } from "@/types/openapi";
import RegistrationOverview from "@/components/competitions/Registration/RegistrationOverview";
import RegistrationStatus from "@/components/competitions/Registration/RegistrationStatus";
import RegistrationProcessing from "@/components/competitions/Registration/RegistrationProcessing";
import { StepContent } from "@/components/competitions/Registration/steps";
import { toaster } from "@/components/ui/toaster";
import { useT } from "@/lib/i18n/useI18n";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import useAPI from "@/lib/wca/useAPI";
import useRegistration, {
  registrationQueryKey,
} from "@/lib/wca/registrations/useRegistration";
import showRegistrationError from "@/lib/wca/registrations/showRegistrationError";
import {
  registrationFormValues,
  useRegistrationForm,
  type RegistrationFormValues,
} from "@/lib/wca/registrations/registrationForm";

type CompetitionInfo = components["schemas"]["CompetitionInfo"];
type StepConfig = components["schemas"]["RegistrationConfig"];
type Registration = components["schemas"]["RegistrationDataV2"];

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

  // Which steps there are, and in which order, is the server's business - but what this lane is
  //   for is registering, so the competing step is the one thing it is built around.
  const competingParameters = steps.find(
    (step) => step.key === "competing",
  )!.parameters;

  const api = useAPI();
  const queryClient = useQueryClient();

  const registration = useRegistration({
    competitionId: competitionInfo.id,
    userId,
    initialRegistration,
  });

  const createRegistration = api.useMutation(
    "post",
    "/v1/competitions/{competitionId}/registrations",
    { onError: (payload) => showRegistrationError(t, payload) },
  );

  const updateRegistration = api.useMutation(
    "patch",
    "/v1/registrations/{registrationId}",
    {
      onError: (payload) => showRegistrationError(t, payload),
      onSuccess: (data) => {
        queryClient.setQueryData(
          registrationQueryKey(competitionInfo.id, userId),
          data.registration,
        );
        toaster.create({
          id: "registration-updated",
          type: "success",
          description: t("registrations.flash.updated"),
        });
      },
    },
  );

  const submitRegistration = (
    { comment, guests, eventIds }: RegistrationFormValues,
    onSubmitted: () => void,
  ) => {
    if (registration === null) {
      // Creating only puts the registration on a queue - the step is done once
      //   `RegistrationProcessing` has seen it come out the other end.
      createRegistration.mutate({
        params: { path: { competitionId: competitionInfo.id } },
        body: {
          user_id: userId,
          guests,
          competing: { event_ids: eventIds, comment },
        },
      });
    } else {
      updateRegistration.mutate(
        {
          params: { path: { registrationId: registration.id } },
          body: {
            guests,
            competing: {
              event_ids: eventIds,
              comment,
              // Registering again after withdrawing means moving back to `pending` for approval.
              ...(registration.competing.registration_status ===
                "cancelled" && { status: "pending" }),
            },
          },
        },
        { onSuccess: onSubmitted },
      );
    }
  };

  const form = useRegistrationForm({
    registration,
    parameters: competingParameters,
    onSubmit: submitRegistration,
  });

  const isSubmitting =
    createRegistration.isPending || updateRegistration.isPending;

  // Withdrawing puts the competitor back at the start: signing up again means going through the
  //   steps again, rather than looking at a summary of a registration that no longer stands.
  const hasStandingRegistration =
    registration !== null &&
    registration.competing.registration_status !== "cancelled";

  // `Steps` reads the index one past the last step as the flow being complete.
  const [currentStep, setCurrentStep] = useState(
    hasStandingRegistration ? steps.length : 0,
  );

  const goToNextStep = () => setCurrentStep((step) => step + 1);

  const finishCreation = () => {
    createRegistration.reset();
    goToNextStep();
  };

  return (
    <VStack width="full" gap="4" align="stretch">
      {/* Withdrawing hands the competitor back to the start of the flow, and this is what tells
          them why the panel they were looking at has reset. */}
      {registration !== null && currentStep < steps.length && (
        <RegistrationStatus registration={registration} />
      )}
      <Steps.Root
        count={steps.length}
        step={currentStep}
        colorPalette="blue"
        // Four labelled steps do not fit side by side on a phone, so there they become one step per
        //   row. `flexDirection` because the vertical variant otherwise puts the strip beside the
        //   panel rather than above it, which is even narrower.
        orientation={{ base: "vertical", lg: "horizontal" }}
        flexDirection="column"
        gap="8"
      >
        {/* Purely a map of what is coming: a step is reached by finishing the one before it, not by
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

        {/* `Steps.Content` only hides the steps that are not current, so only the current one is
            mounted - each step then starts out fresh when the competitor reaches it. */}
        {steps.map(
          (step, index) =>
            index === currentStep && (
              <Steps.Content key={step.key} index={index}>
                {createRegistration.isSuccess ? (
                  <RegistrationProcessing
                    competitionId={competitionInfo.id}
                    userId={userId}
                    onCreated={finishCreation}
                  />
                ) : (
                  <StepContent
                    step={step}
                    competitionInfo={competitionInfo}
                    registration={registration}
                    form={form}
                    isSubmitting={isSubmitting}
                    onNext={goToNextStep}
                    leadsToOverview={index === steps.length - 1}
                  />
                )}
              </Steps.Content>
            ),
        )}

        <Steps.CompletedContent>
          {registration !== null && (
            <RegistrationOverview
              steps={steps}
              competitionInfo={competitionInfo}
              registration={registration}
              userId={userId}
              form={form}
              isSubmitting={isSubmitting}
              // Reset on the way in rather than on the way out, so that the form the competitor
              //   opens always starts from what is currently saved.
              onStartEditing={() =>
                form.reset(
                  registrationFormValues(registration, competingParameters),
                )
              }
              onWithdrawn={() => setCurrentStep(0)}
            />
          )}
        </Steps.CompletedContent>
      </Steps.Root>
    </VStack>
  );
}
