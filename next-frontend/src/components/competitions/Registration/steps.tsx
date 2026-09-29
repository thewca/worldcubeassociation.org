"use client";

import { Button, DataList, HStack, Stack, Text } from "@chakra-ui/react";
import { DateTime } from "luxon";
import { LuCheck } from "react-icons/lu";
import RequirementsStep from "@/components/competitions/Registration/RequirementsStep";
import CompetingStep from "@/components/competitions/Registration/CompetingStep";
import PaymentStep from "@/components/competitions/Registration/PaymentStep";
import RegistrationStatus from "@/components/competitions/Registration/RegistrationStatus";
import { LabelledEventIcon } from "@/components/EventIcon";
import canEditRegistration from "@/lib/wca/registrations/canEditRegistration";
import { useT } from "@/lib/i18n/useI18n";
import type { components } from "@/types/openapi";

type StepConfig = components["schemas"]["RegistrationConfig"];
type CompetitionInfo = components["schemas"]["CompetitionInfo"];
type Registration = components["schemas"]["RegistrationDataV2"];

function NextStepButton({ onNext }: { onNext: () => void }) {
  const { t } = useT();

  return (
    <Button width="full" colorPalette="blue" onClick={onNext}>
      {t("competitions.registration_v2.requirements.next_step")}
    </Button>
  );
}

/**
 * What a step asks of the competitor. Steps know nothing about each other - which ones there are
 * and in which order is up to the server - so each one only reports back that it is done.
 */
export function StepContent({
  step,
  competitionInfo,
  registration,
  userId,
  onNext,
  onClose,
}: {
  step: StepConfig;
  competitionInfo: CompetitionInfo;
  registration: Registration | null;
  userId: number;
  onNext: () => void;
  // Only set when the step is opened from the overview, which is the one place the competitor can
  //   leave it again without finishing it.
  onClose?: () => void;
}) {
  switch (step.key) {
    case "requirements":
      return <RequirementsStep onContinue={onNext} />;
    case "competing":
      return (
        <CompetingStep
          competitionInfo={competitionInfo}
          parameters={step.parameters}
          registration={registration}
          userId={userId}
          onSubmitted={onNext}
          onClose={onClose}
        />
      );
    case "payment":
      return (
        <Stack>
          <PaymentStep
            competitionInfo={competitionInfo}
            registration={registration}
            deadline={step.deadline}
          />
          <NextStepButton onNext={onNext} />
        </Stack>
      );
    case "approval":
      return (
        <Stack>
          {registration && <RegistrationStatus registration={registration} />}
          <NextStepButton onNext={onNext} />
        </Stack>
      );
  }
}

/** What the competitor settled in a step, as shown on the overview once they have walked them all. */
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

  switch (step.key) {
    case "requirements":
      return (
        <HStack>
          <LuCheck />
          <Text>{t("competitions.registration_v2.requirements.accepted")}</Text>
        </HStack>
      );
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

/** Whether the competitor may open this step again from the overview. */
export function isStepEditable(step: StepConfig, registration: Registration) {
  switch (step.key) {
    case "competing":
      return (
        step.isEditable && canEditRegistration(step.parameters, registration)
      );
    default:
      return step.isEditable;
  }
}
