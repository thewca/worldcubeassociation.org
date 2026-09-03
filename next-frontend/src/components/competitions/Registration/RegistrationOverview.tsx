"use client";

import {
  Alert,
  Button,
  ButtonGroup,
  DataList,
  Heading,
  HStack,
  Spinner,
  VStack,
  Text,
} from "@chakra-ui/react";
import type { ReactNode } from "react";
import { LuPencil, LuTrash2 } from "react-icons/lu";
import EventIcon from "@/components/EventIcon";
import { useT } from "@/lib/i18n/useI18n";
import { useConfirm } from "@/providers/ConfirmProvider";
import type { components } from "@/types/openapi";
import { DateTime } from "luxon";

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

const STATUS_ALERTS = {
  pending: { status: "info", message: "needs_approval" },
  waiting_list: { status: "warning", message: "is_waitlisted" },
  accepted: { status: "success", message: "is_accepted" },
  cancelled: { status: "warning", message: "is_cancelled" },
  rejected: { status: "error", message: "is_rejected" },
} as const;

function isKnownStatus(status?: string): status is keyof typeof STATUS_ALERTS {
  return status !== undefined && status in STATUS_ALERTS;
}

export function RegistrationStatus({
  registration,
}: {
  registration: Registration;
}) {
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

/**
 * What a competitor sees once they have registered. The summary and the form they edit it with
 * take the same place in the card, so that switching between them keeps the heading the competitor
 * is reading in place - `children` is the form. The registration's standing is said by the approval
 * step above rather than here.
 */
export default function RegistrationOverview({
  competitionInfo,
  registration,
  queueCount,
  canEdit,
  isEditing,
  onEditingChange,
  isCancelling,
  onCancel,
  children,
}: {
  competitionInfo: CompetitionInfo;
  registration: Registration | null;
  queueCount?: number;
  canEdit: boolean;
  isEditing: boolean;
  onEditingChange: (isEditing: boolean) => void;
  isCancelling: boolean;
  onCancel: (registrationId: number) => void;
  children: ReactNode;
}) {
  const { t } = useT();
  const confirm = useConfirm();

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
        onCancel(registration.id);
        return;
      }

      window.location.href = contactUrl(
        competitionInfo.id,
        t("competitions.registration_v2.update.delete_contact_message"),
      );
    });

  return (
    <VStack gap={4} alignItems="stretch" width="full">
      <Heading textStyle="h3">
        {t("competitions.nav.menu.registration")}
      </Heading>
      {isEditing ? (
        children
      ) : (
        <DataList.Root orientation="horizontal">
          <DataList.Item>
            <DataList.ItemLabel>
              {t("competitions.competition_form.events")}
            </DataList.ItemLabel>
            <DataList.ItemValue>
              <HStack>
                {registration.competing.event_ids.map((eventId) => (
                  <EventIcon key={eventId} eventId={eventId} size="lg" />
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
      )}

      {/* Under the summary rather than beside the heading, so that the actions sit where the
          form's own button sits and stay reachable on a phone - side by side, sharing the width
          the form's own button spans. Editing has no button of its own here: the form's button
          doubles as the way back out of it. */}
      <ButtonGroup variant="outline" width="full">
        {!isEditing && canEdit && (
          <Button
            flex="1"
            colorPalette="blue"
            onClick={() => onEditingChange(true)}
          >
            <LuPencil />
            <Text hideBelow="md">{t("registrations.update")}</Text>
            <Text hideFrom="md">
              {t("competition_tabs.form_elements.update")}
            </Text>
          </Button>
        )}
        {CANCELLABLE_STATUSES.includes(status ?? "") && (
          <Button
            flex="1"
            colorPalette="red"
            loading={isCancelling}
            onClick={requestCancellation}
          >
            <LuTrash2 />
            <Text hideBelow="md">{t("registrations.delete_registration")}</Text>
            <Text hideFrom="md">
              {t("competition_tabs.form_elements.delete")}
            </Text>
          </Button>
        )}
      </ButtonGroup>
    </VStack>
  );
}
