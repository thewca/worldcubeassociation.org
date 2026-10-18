"use client";

import { Alert, Link, List } from "@chakra-ui/react";
import { Trans } from "react-i18next";
import { useT } from "@/lib/i18n/useI18n";
import type { components } from "@/types/openapi";
import { DateTime } from "luxon";

type CompetitionInfo = components["schemas"]["CompetitionInfo"];
type RegistrationEligibility = components["schemas"]["RegistrationEligibility"];
type MissingProfileField =
  RegistrationEligibility["missing_profile_fields"][number];

// `registrations.errors.need_country` rather than `...need_country_iso2`, because the translations
//   name the concept the competitor has to fix rather than the database column.
const PROFILE_FIELD_MESSAGES = {
  name: "registrations.errors.need_name",
  gender: "registrations.errors.need_gender",
  dob: "registrations.errors.need_dob",
  country_iso2: "registrations.errors.need_country",
} as const satisfies Record<MissingProfileField, string>;

function BannedMessage({ bannedUntil }: { bannedUntil?: string | null }) {
  const { t } = useT();

  return (
    <Alert.Root status="error">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>
          <Trans
            t={t}
            i18nKey="registrations.errors.banned_html"
            components={{ a: <Link variant="underline" /> }}
          />
        </Alert.Title>
        {bannedUntil && (
          <Alert.Description>
            {t("registrations.errors.banned_until", {
              date: DateTime.fromISO(bannedUntil).toLocaleString(
                DateTime.DATE_FULL,
              ),
            })}
          </Alert.Description>
        )}
      </Alert.Content>
    </Alert.Root>
  );
}

function IncompleteProfileMessage({
  competitionInfo,
  userId,
  missingFields,
}: {
  competitionInfo: CompetitionInfo;
  userId: number;
  missingFields: MissingProfileField[];
}) {
  const { t } = useT();

  return (
    <Alert.Root status="error">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>
          <Trans
            t={t}
            i18nKey="registrations.please_fix_profile_html"
            values={{
              comp: competitionInfo.name,
              profile: `<a href='https://www.worldcubeassociation.org/users/${userId}/edit'>${t("registrations.profile")}</a>`,
            }}
            components={{ a: <Link variant="underline" target="_blank" /> }}
          />
        </Alert.Title>
        <Alert.Description asChild>
          <List.Root ps="6">
            {missingFields.map((field) => (
              <List.Item key={field}>
                {t(PROFILE_FIELD_MESSAGES[field])}
              </List.Item>
            ))}
          </List.Root>
        </Alert.Description>
      </Alert.Content>
    </Alert.Root>
  );
}

export default function RegistrationNotAllowedMessage({
  competitionInfo,
  eligibility,
  userId,
}: {
  competitionInfo: CompetitionInfo;
  eligibility: RegistrationEligibility;
  userId: number;
}) {
  return (
    <>
      {eligibility.banned && (
        <BannedMessage bannedUntil={eligibility.banned_until} />
      )}
      {eligibility.missing_profile_fields.length > 0 && (
        <IncompleteProfileMessage
          competitionInfo={competitionInfo}
          userId={userId}
          missingFields={eligibility.missing_profile_fields}
        />
      )}
    </>
  );
}
