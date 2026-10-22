"use client";

import { Alert, Checkbox } from "@chakra-ui/react";
import { useT } from "@/lib/i18n/useI18n";
import type { RegistrationForm } from "@/lib/wca/registrations/registrationForm";

export default function RequirementsStep({ form }: { form: RegistrationForm }) {
  const { t } = useT();

  return (
    <form.Field name="hasAcknowledgedRequirements">
      {(field) => (
        <Checkbox.Root
          variant="solid"
          width="full"
          cursor="pointer"
          checked={field.state.value}
          onCheckedChange={(e) => field.handleChange(!!e.checked)}
        >
          <Checkbox.HiddenInput />
          <Alert.Root status="success">
            <Alert.Indicator>
              <Checkbox.Control />
            </Alert.Indicator>
            <Alert.Title asChild>
              <Checkbox.Label>
                {t("competitions.registration_v2.requirements.acknowledgement")}
              </Checkbox.Label>
            </Alert.Title>
          </Alert.Root>
        </Checkbox.Root>
      )}
    </form.Field>
  );
}
