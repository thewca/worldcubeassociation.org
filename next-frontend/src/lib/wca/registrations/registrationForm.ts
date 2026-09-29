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

export const registrationFormValues = (
  registration: Registration | null,
  parameters: CompetingStepParameters,
): RegistrationFormValues => ({
  comment: registration?.competing.comment ?? "",
  guests: registration?.guests ?? 0,
  eventIds:
    registration?.competing.event_ids ?? preselectedEventIds(parameters),
});

/**
 * The form belongs to the lane rather than to the step that draws it: the competing step is mounted
 * and unmounted as the competitor moves between their registration summary and the form, and what
 * they have typed has to outlive that. Callers reset it to `registrationFormValues` whenever they
 * hand the form back to the competitor.
 */
export function useRegistrationForm({
  registration,
  parameters,
  onSubmit,
}: {
  registration: Registration | null;
  parameters: CompetingStepParameters;
  onSubmit: (values: RegistrationFormValues, onSubmitted: () => void) => void;
}) {
  return useForm({
    defaultValues: registrationFormValues(registration, parameters),
    // Where the competitor goes once the submission went through is up to whoever drew the form.
    onSubmitMeta: { onSubmitted: () => {} },
    onSubmit: ({ value, meta }) => onSubmit(value, meta.onSubmitted),
  });
}

export type RegistrationForm = ReturnType<typeof useRegistrationForm>;
