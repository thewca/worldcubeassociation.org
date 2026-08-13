"use client";

import {
  Alert,
  DataList,
  HStack,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import EventIcon from "@/components/EventIcon";
import { useT } from "@/lib/i18n/useI18n";
import type { components } from "@/types/openapi";
import { DateTime } from "luxon";

type CompetitionInfo = components["schemas"]["CompetitionInfo"];
type Registration = components["schemas"]["RegistrationDataV2"];

const STATUS_ALERTS = {
  pending: { status: "info", message: "needs_approval" },
  waiting_list: { status: "warning", message: "is_waitlisted" },
  accepted: { status: "success", message: "is_accepted" },
  cancelled: { status: "neutral", message: "is_cancelled" },
  rejected: { status: "error", message: "is_rejected" },
} as const;

function isKnownStatus(status?: string): status is keyof typeof STATUS_ALERTS {
  return status !== undefined && status in STATUS_ALERTS;
}

function RegistrationStatus({ registration }: { registration: Registration }) {
  const { t } = useT();

  const status = registration.competing.registration_status;

  if (!isKnownStatus(status)) {
    return null;
  }

  const { status: alertStatus, message } = STATUS_ALERTS[status];

  return (
    <Alert.Root status={alertStatus}>
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>
          {t(
            `competitions.registration_v2.register.registration_status.${status}`,
            {
              waiting_list_position:
                registration.competing.waiting_list_position,
            },
          )}
        </Alert.Title>
        <Alert.Description>
          {t(`competitions.registration_v2.info.${message}`)}
        </Alert.Description>
      </Alert.Content>
    </Alert.Root>
  );
}

export default function RegistrationOverview({
  competitionInfo,
  registration,
  queueCount,
}: {
  competitionInfo: CompetitionInfo;
  registration: Registration | null;
  queueCount?: number;
}) {
  const { t } = useT();

  // The registration is created by a queue worker, so right after submitting there is a window in
  //   which it does not exist yet. The queue tells us how many submissions are ahead of ours.
  if (registration === null) {
    return (
      <HStack>
        <Spinner />
        <Text>
          {queueCount === undefined
            ? t("competitions.registration_v2.register.processing")
            : t("competitions.registration_v2.register.processing_queue", {
                queueCount,
              })}
        </Text>
      </HStack>
    );
  }

  return (
    <Stack>
      <RegistrationStatus registration={registration} />
      <DataList.Root orientation="horizontal">
        <DataList.Item>
          <DataList.ItemLabel>
            {t("competitions.competition_form.events")}
          </DataList.ItemLabel>
          <DataList.ItemValue>
            {registration.competing.event_ids.map((eventId) => (
              <EventIcon key={eventId} eventId={eventId} />
            ))}
          </DataList.ItemValue>
        </DataList.Item>
        <DataList.Item>
          <DataList.ItemLabel>
            {t("competitions.registration_v2.register.comment")}
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
        {competitionInfo["using_payment_integrations?"] && (
          <DataList.Item>
            <DataList.ItemLabel>
              {t("registrations.payment_form.labels.payment_information")}
            </DataList.ItemLabel>
            <DataList.ItemValue>
              {registration.payment?.has_paid
                ? t("registrations.payment_form.labels.fees_paid")
                : t("registrations.payment_form.labels.fees_remaining")}
            </DataList.ItemValue>
          </DataList.Item>
        )}
      </DataList.Root>
    </Stack>
  );
}
