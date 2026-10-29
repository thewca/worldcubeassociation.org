import type { components } from "@/types/openapi";
import { Trans } from "react-i18next/TransWithoutContext";
import { useT } from "@/lib/i18n/useI18n";

type Registration = components["schemas"]["RegistrationDataV2"];

export default function ApprovalStatus({
  registration,
}: {
  registration: Registration;
}) {
  const { t } = useT();

  if (registration.competing.registration_status === "pending") {
    return <Trans i18nKey="registrations.mailer.new.approval_info_html" />;
  }
  return t(
    `competitions.registration_v2.register.registration_status.${registration.competing.registration_status}`,
    {
      waiting_list_position: registration.competing.waiting_list_position,
    },
  );
}
