"use client";

import { DataList, HStack, Text } from "@chakra-ui/react";
import { DateTime } from "luxon";
import RequirementsStep from "@/components/competitions/Registration/RequirementsStep";
import CompetingStep from "@/components/competitions/Registration/CompetingStep";
import PaymentStep from "@/components/competitions/Registration/PaymentStep";
import RegistrationStatus from "@/components/competitions/Registration/RegistrationStatus";
import { LabelledEventIcon } from "@/components/EventIcon";
import canEditRegistration from "@/lib/wca/registrations/canEditRegistration";
import { useT } from "@/lib/i18n/useI18n";
import {
  eventLimit,
  guestLimit,
} from "@/lib/wca/registrations/competingLimits";
import type {
  RegistrationForm,
  RegistrationFormValues,
} from "@/lib/wca/registrations/registrationForm";
import type { components } from "@/types/openapi";

type StepConfig = components["schemas"]["RegistrationConfig"];
type CompetitionInfo = components["schemas"]["CompetitionInfo"];
type Registration = components["schemas"]["RegistrationDataV2"];

/** What a step asks of the competitor. Moving on from it is up to whoever renders it. */
export function StepContent({
  step,
  competitionInfo,
  registration,
  form,
}: {
  step: StepConfig;
  competitionInfo: CompetitionInfo;
  registration: Registration | null;
  form: RegistrationForm;
}) {
  switch (step.key) {
    case "requirements":
      return <RequirementsStep form={form} />;
    case "competing":
      return (
        <CompetingStep
          competitionInfo={competitionInfo}
          parameters={step.parameters}
          registration={registration}
          form={form}
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
      return registration && <RegistrationStatus registration={registration} />;
  }
}

/**
 * Whether the competitor has given everything a step asks of them. Field validators only fire once
 * a field has been touched, so this is checked on its own - otherwise an untouched form would
 * submit an empty event list that the backend rejects.
 */
export function isStepComplete(
  step: StepConfig,
  values: RegistrationFormValues,
) {
  switch (step.key) {
    case "requirements":
      return values.hasAcknowledgedRequirements;
    case "competing":
      return (
        values.eventIds.length > 0 &&
        values.eventIds.length <= eventLimit(step.parameters) &&
        values.guests <= guestLimit(step.parameters) &&
        (!step.parameters.force_comment_in_registration ||
          values.comment.trim() !== "")
      );
    case "payment":
    case "approval":
      return true;
  }
}

/** What the competitor settled in a step, as shown on the summary once they have walked them all. */
export function StepSummary({
  step,
  competitionInfo,
  registration,
}: {
  step: StepConfig;
  competitionInfo: CompetitionInfo;
  registration: Registration;
}) {
  const { t } = useT();

  if (step.summary_status === "hide") {
    return;
  }

  switch (step.key) {
    case "competing":
      return (
        <DataList.Root orientation="horizontal">
          <DataList.Item>
            <DataList.ItemLabel>
              {t("competitions.competition_form.events")}
            </DataList.ItemLabel>
            <DataList.ItemValue>
              <HStack wrap="wrap">
                {registration.competing.event_ids.map((eventId) => (
                  <LabelledEventIcon
                    key={eventId}
                    eventId={eventId}
                    size="lg"
                  />
                ))}
              </HStack>
            </DataList.ItemValue>
          </DataList.Item>
          <DataList.Item>
            <DataList.ItemLabel>
              {t("competitions.registration_v2.register.comment_overview")}
            </DataList.ItemLabel>
            <DataList.ItemValue>
              {registration.competing.comment ||
                t("competitions.registration_v2.list.empty")}
            </DataList.ItemValue>
          </DataList.Item>
          <DataList.Item>
            <DataList.ItemLabel>
              {t("activerecord.attributes.registration.guests")}
            </DataList.ItemLabel>
            <DataList.ItemValue>
              {/* `guests` is only serialised on the authenticated variant of this payload, which
                is the only one this panel is ever handed. */}
              {registration.guests ?? 0}
            </DataList.ItemValue>
          </DataList.Item>
          {registration.competing.registered_on && (
            <DataList.Item>
              <DataList.ItemLabel>
                {t("competitions.registration_v2.list.timestamp")}
              </DataList.ItemLabel>
              <DataList.ItemValue>
                {DateTime.fromISO(
                  registration.competing.registered_on,
                ).toLocaleString(DateTime.DATETIME_FULL)}
              </DataList.ItemValue>
            </DataList.Item>
          )}
        </DataList.Root>
      );
    case "payment": {
      // Only a registration still waiting for approval has a fee to chase: organizers accepting or
      //   waitlisting someone settles the question - their fee has been waived, or is being
      //   collected some other way - and a withdrawn or rejected competitor owes nothing at all.
      const isPaymentOutstanding =
        registration.competing.registration_status === "pending" &&
        !registration.payment?.has_paid;

      return isPaymentOutstanding ? (
        <PaymentStep
          competitionInfo={competitionInfo}
          registration={registration}
          deadline={step.deadline}
        />
      ) : (
        <Text>
          {registration.payment?.has_paid
            ? t("registrations.payment_form.labels.fees_paid")
            : t("registrations.payment_form.labels.fees_remaining")}
        </Text>
      );
    }
    case "approval":
      return <RegistrationStatus registration={registration} />;
  }
}

/** Whether the competitor may open this step again from the summary. */
export function isStepEditable(step: StepConfig, registration: Registration) {
  switch (step.key) {
    case "competing":
      return (
        step.is_editable && canEditRegistration(step.parameters, registration)
      );
    default:
      return step.is_editable;
  }
}

/**
 * Where the flow starts. Withdrawing puts the competitor back at the start: signing up again means
 * going through the steps again, rather than looking at a summary of a registration that no longer
 * stands. `Steps` reads the index one past the last step as the flow being complete.
 */
export function initialStepIndex(
  steps: StepConfig[],
  registration: Registration | null,
) {
  const hasStandingRegistration =
    registration !== null &&
    registration.competing.registration_status !== "cancelled";

  return hasStandingRegistration ? steps.length : 0;
}

const byPriority = (steps: StepConfig[]) => [
  ...steps.filter((step) => step.summary_status === "priority"),
  ...steps.filter((step) => step.summary_status === "show"),
];

/**
 * The steps the summary shows: the ones after submitting first, as they are what is still going on
 * with the registration. Within each group, the ones the server marks as priority come first.
 */
export function summarySteps(steps: StepConfig[]) {
  return [
    ...byPriority(steps.filter((step) => step.is_post_step)),
    ...byPriority(steps.filter((step) => !step.is_post_step)),
  ];
}
