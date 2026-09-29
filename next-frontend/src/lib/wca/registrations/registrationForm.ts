import { useForm } from "@tanstack/react-form";
import { preselectedEventIds } from "@/lib/wca/registrations/eventSelection";
import type { components } from "@/types/openapi";

type CompetingStepParameters =
  components["schemas"]["CompetingStepConfig"]["parameters"];
type Registration = components["schemas"]["RegistrationDataV2"];

export interface RegistrationFormValues {
  comment: string;
  guests: number;
  eventIds: string[];
}

const registrationFormValues = (
  registration: Registration | null,
  parameters: CompetingStepParameters,
): RegistrationFormValues => ({
  comment: registration?.competing.comment ?? "",
  guests: registration?.guests ?? 0,
  eventIds:
    registration?.competing.event_ids ?? preselectedEventIds(parameters),
});

export function useRegistrationForm({
  registration,
  parameters,
  onSubmit,
}: {
  registration: Registration | null;
  parameters: CompetingStepParameters;
  onSubmit: (values: RegistrationFormValues) => void;
}) {
  return useForm({
    defaultValues: registrationFormValues(registration, parameters),
    onSubmit: ({ value }) => onSubmit(value),
  });
}
