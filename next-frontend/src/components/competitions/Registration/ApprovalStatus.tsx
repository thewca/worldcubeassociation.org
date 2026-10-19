import type { components } from "@/types/openapi";
import { Trans } from "react-i18next/TransWithoutContext";

type Registration = components["schemas"]["RegistrationDataV2"];

export default function ApprovalStatus({
  registration,
}: {
  registration: Registration;
}) {
  if (registration.competing.registration_status === "pending") {
    return <Trans i18nKey="registrations.mailer.new.approval_info_html" />;
  }
}
