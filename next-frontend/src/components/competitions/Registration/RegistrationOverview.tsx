"use client";

import { Button, Heading, Text, VStack } from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { LuPencil, LuTrash2 } from "react-icons/lu";
import {
  isStepEditable,
  StepContent,
  StepSummary,
} from "@/components/competitions/Registration/steps";
import { toaster } from "@/components/ui/toaster";
import { useT } from "@/lib/i18n/useI18n";
import useAPI from "@/lib/wca/useAPI";
import { registrationQueryKey } from "@/lib/wca/registrations/useRegistration";
import showRegistrationError from "@/lib/wca/registrations/showRegistrationError";
import type { RegistrationForm } from "@/lib/wca/registrations/registrationForm";
import { useConfirm } from "@/providers/ConfirmProvider";
import type { components } from "@/types/openapi";

type StepConfig = components["schemas"]["RegistrationConfig"];
type StepKey = StepConfig["key"];
type CompetitionInfo = components["schemas"]["CompetitionInfo"];
type Registration = components["schemas"]["RegistrationDataV2"];

// Registrations a competitor can still withdraw from - the others are already over, one way or
//   another.
const CANCELLABLE_STATUSES = ["pending", "accepted", "waiting_list"];

// Withdrawing without asking the organizers first is a privilege the competition grants; whoever
//   does not have it is sent to the organizers instead. This page lives on a different host than
//   the contact form, so the link has to be absolute.
const contactUrl = (competitionId: string, message: string) =>
  `https://www.worldcubeassociation.org/contact?${new URLSearchParams({
    competitionId,
    contactRecipient: "competition",
    message,
  })}`;

/**
 * What a competitor sees once they have walked all the steps: what they settled in each of them,
 * in the order the server listed them. A step the server marks as editable can be opened again in
 * place of its summary, so that the heading the competitor is reading stays where it is.
 */
export default function RegistrationOverview({
  steps,
  competitionInfo,
  registration,
  userId,
  form,
  isSubmitting,
  onStartEditing,
  onWithdrawn,
}: {
  steps: StepConfig[];
  competitionInfo: CompetitionInfo;
  registration: Registration;
  userId: number;
  form: RegistrationForm;
  isSubmitting: boolean;
  onStartEditing: () => void;
  onWithdrawn: () => void;
}) {
  const { t } = useT();
  const confirm = useConfirm();
  const api = useAPI();
  const queryClient = useQueryClient();

  const [editingStepKey, setEditingStepKey] = useState<StepKey>();

  const cancelRegistration = api.useMutation(
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
          id: "registration-cancelled",
          type: "success",
          description: t(
            "competitions.registration_v2.register.registration_status.cancelled",
          ),
        });
        onWithdrawn();
      },
    },
  );

  const status = registration.competing.registration_status;

  const mayCancelWithoutAsking =
    competitionInfo.competitor_can_cancel === "always" ||
    (competitionInfo.competitor_can_cancel === "not_accepted" &&
      status !== "accepted") ||
    (competitionInfo.competitor_can_cancel === "unpaid" &&
      !registration.payment?.has_paid);

  const requestCancellation = () =>
    confirm({
      content: mayCancelWithoutAsking
        ? t("registrations.delete_confirm")
        : t("competitions.registration_v2.update.delete_confirm_contact"),
    }).then(() => {
      if (mayCancelWithoutAsking) {
        cancelRegistration.mutate({
          params: { path: { registrationId: registration.id } },
          body: { competing: { status: "cancelled" } },
        });
        return;
      }

      window.location.href = contactUrl(
        competitionInfo.id,
        t("competitions.registration_v2.update.delete_contact_message"),
      );
    });

  const stopEditing = () => setEditingStepKey(undefined);

  return (
    <VStack gap={6} alignItems="stretch" width="full">
      {steps.map((step) => {
        const isEditing = editingStepKey === step.key;

        return (
          <VStack key={step.key} gap={4} alignItems="stretch">
            <Heading textStyle="h3">
              {t(
                `competitions.registration_v2.register.panel.${step.key}.title`,
              )}
            </Heading>
            {isEditing ? (
              <StepContent
                step={step}
                competitionInfo={competitionInfo}
                registration={registration}
                form={form}
                isSubmitting={isSubmitting}
                onNext={stopEditing}
                leadsToOverview
                onClose={stopEditing}
              />
            ) : (
              <StepSummary
                step={step}
                competitionInfo={competitionInfo}
                registration={registration}
              />
            )}
            {!isEditing && isStepEditable(step, registration) && (
              <Button
                width="full"
                variant="outline"
                colorPalette="blue"
                onClick={() => {
                  onStartEditing();
                  setEditingStepKey(step.key);
                }}
              >
                <LuPencil />
                {t("competition_tabs.form_elements.update")}
              </Button>
            )}
          </VStack>
        );
      })}

      {CANCELLABLE_STATUSES.includes(status ?? "") && (
        <Button
          width="full"
          variant="outline"
          colorPalette="red"
          loading={cancelRegistration.isPending}
          onClick={requestCancellation}
        >
          <LuTrash2 />
          <Text hideBelow="md">{t("registrations.delete_registration")}</Text>
          <Text hideFrom="md">
            {t("competition_tabs.form_elements.delete")}
          </Text>
        </Button>
      )}
    </VStack>
  );
}
