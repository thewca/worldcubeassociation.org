"use client";

import { Alert, VStack } from "@chakra-ui/react";
import type { components } from "@/types/openapi";
import { useT } from "@/lib/i18n/useI18n";
import { hasNotPassed, hasPassed } from "@/lib/wca/dates";
import usePerpetualState from "@/lib/hooks/usePerpetualState";
import StepPanel from "@/app/(wca)/(content-pages)/competitions/[competitionId]/(competition)/register/StepPanel";
import RegistrationNotAllowedMessage from "@/components/competitions/Registration/RegistrationNotAllowedMessage";
import RegistrationOpeningMessage from "@/components/competitions/Registration/RegistrationOpeningMessage";
import RegistrationClosingMessage from "@/components/competitions/Registration/RegistrationClosingMessage";
import useRegistration from "@/lib/wca/registrations/useRegistration";

type CompetitionInfo = components["schemas"]["V1CompetitionInfo"];
type StepConfig = components["schemas"]["RegistrationConfig"];
type Registration = components["schemas"]["RegistrationDataV2"];
type RegistrationEligibility = components["schemas"]["RegistrationEligibility"];

// Registrations in these states keep the panel reachable even once registration has closed, so
//   that competitors can still look at (and where allowed, edit) what they signed up for.
const VIEWABLE_REGISTRATION_STATES = ["accepted", "pending", "waiting_list"];

function RegistrationFullMessage({
  competitionInfo,
  waitingListCount,
}: {
  competitionInfo: CompetitionInfo;
  waitingListCount: number;
}) {
  const { t } = useT();

  return (
    <Alert.Root status="warning" width="full">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>
          {t("registrations.registration_full_include_waiting_list", {
            competitor_limit:
              competitionInfo.registration_info.competitor_limit,
          })}
        </Alert.Title>
        <Alert.Description>
          {t("competitions.registration_v2.register.waiting_list_count", {
            count: waitingListCount,
          })}
        </Alert.Description>
      </Alert.Content>
    </Alert.Root>
  );
}

export default function RegistrationPanel({
  steps,
  competitionInfo,
  eligibility,
  userId,
  initialRegistration,
}: {
  steps: StepConfig[];
  competitionInfo: CompetitionInfo;
  eligibility: RegistrationEligibility;
  userId: number;
  initialRegistration: Registration | null;
}) {
  const { t } = useT();

  const registrationInfo = competitionInfo.registration_info;

  // The competitor can withdraw from inside the panel, and once registration has closed that is
  //   what decides whether the panel is still theirs to see - so the live registration, not the
  //   one the page was rendered with.
  const registration = useRegistration({
    competitionId: competitionInfo.id,
    userId,
    initialRegistration,
  });

  // Ticking rather than computed once, so that the countdown below turns into the panel the
  //   moment registration opens, without the competitor having to reload.
  const registrationHasOpened = usePerpetualState(() =>
    hasPassed(registrationInfo.opens_at),
  );
  const registrationHasNotClosed = usePerpetualState(() =>
    hasNotPassed(registrationInfo.closes_at),
  );

  if (eligibility.banned || eligibility.missing_profile_fields.length > 0) {
    return (
      <RegistrationNotAllowedMessage
        competitionInfo={competitionInfo}
        eligibility={eligibility}
        userId={userId}
      />
    );
  }

  const isPreRegistering =
    eligibility.can_pre_register && !registrationHasOpened;

  const status = registration?.competing.registration_status;
  const hasViewableRegistration =
    status !== undefined && VIEWABLE_REGISTRATION_STATES.includes(status);

  const showPanel =
    (registrationHasOpened && registrationHasNotClosed) ||
    (eligibility.can_pre_register && registrationHasNotClosed) ||
    hasViewableRegistration;

  const isRegistrationFull =
    registrationInfo.spots_left !== null && registrationInfo.spots_left <= 0;

  return (
    <VStack width="full" gap="4" align="stretch">
      {registrationInfo.opens_at && (
        <RegistrationOpeningMessage
          registrationStart={registrationInfo.opens_at}
        />
      )}
      {registrationInfo.closes_at && (
        <RegistrationClosingMessage
          registrationEnd={registrationInfo.closes_at}
        />
      )}
      {isPreRegistering && (
        <Alert.Root status="info" width="full">
          <Alert.Indicator />
          <Alert.Title>
            {t("competitions.registration_v2.register.early_registration")}
          </Alert.Title>
        </Alert.Root>
      )}
      {isRegistrationFull && (
        <RegistrationFullMessage
          competitionInfo={competitionInfo}
          waitingListCount={eligibility.waiting_list_count}
        />
      )}
      {showPanel && (
        <StepPanel
          steps={steps}
          competitionInfo={competitionInfo}
          userId={userId}
          initialRegistration={initialRegistration}
        />
      )}
    </VStack>
  );
}
