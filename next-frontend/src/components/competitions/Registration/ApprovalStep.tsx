"use client";

import { Stack } from "@chakra-ui/react";
import RegistrationStatus from "@/components/competitions/Registration/RegistrationStatus";
import NextStepButton from "@/components/competitions/Registration/NextStepButton";
import type { components } from "@/types/openapi";

type Registration = components["schemas"]["RegistrationDataV2"];

export default function ApprovalStep({
  registration,
  leadsToSummary,
  onNext,
}: {
  registration: Registration | null;
  leadsToSummary: boolean;
  onNext: () => void;
}) {
  return (
    <Stack>
      {registration && <RegistrationStatus registration={registration} />}
      <NextStepButton leadsToSummary={leadsToSummary} onNext={onNext} />
    </Stack>
  );
}
