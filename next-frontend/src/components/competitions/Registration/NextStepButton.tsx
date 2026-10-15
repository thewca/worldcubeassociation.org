"use client";

import { Button } from "@chakra-ui/react";
import { useT } from "@/lib/i18n/useI18n";

export default function NextStepButton({
  leadsToSummary,
  onNext,
  disabled,
}: {
  leadsToSummary: boolean;
  onNext: () => void;
  disabled?: boolean;
}) {
  const { t } = useT();

  const label = leadsToSummary
    ? t("competitions.registration_v2.register.view_registration")
    : t("competitions.registration_v2.requirements.next_step");

  return (
    <Button
      width="full"
      colorPalette="blue"
      disabled={disabled}
      onClick={onNext}
    >
      {label}
    </Button>
  );
}
