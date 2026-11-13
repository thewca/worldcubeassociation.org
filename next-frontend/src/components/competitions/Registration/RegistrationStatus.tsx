"use client";

import { Alert } from "@chakra-ui/react";
import { useT } from "@/lib/i18n/useI18n";
import type { components } from "@/types/openapi";

type Registration = components["schemas"]["RegistrationDataV2"];

const STATUS_ALERTS = {
  pending: { status: "info", message: "needs_approval" },
  waiting_list: { status: "warning", message: "is_waitlisted" },
  accepted: { status: "success", message: "is_accepted" },
  cancelled: { status: "warning", message: "is_cancelled" },
  rejected: { status: "error", message: "is_rejected" },
} as const;

export default function RegistrationStatus({
  registration,
}: {
  registration: Registration;
}) {
  const { t } = useT();

  const status = registration.competing.registration_status;

  if (status === undefined) {
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
