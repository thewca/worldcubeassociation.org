import { useForm } from "@tanstack/react-form";
import { preselectedEventIds } from "@/lib/wca/registrations/eventSelection";
import type { components } from "@/types/openapi";

type StepConfig = components["schemas"]["RegistrationConfig"];
type Registration = components["schemas"]["RegistrationDataV2"];

export interface RegistrationFormValues {
  comment: string;
  guests: number;
  eventIds: string[];
}

// Which steps the lane has is up to the server, so a fresh registration starts out empty and each
//   step that is there seeds the fields it asks for.
const stepDefaultValues = (
  step: StepConfig,
): Partial<RegistrationFormValues> => {
  switch (step.key) {
    case "competing":
      return { eventIds: preselectedEventIds(step.parameters) };
    default:
      return {};
  }
};

export const registrationFormValues = (
  registration: Registration | null,
  steps: StepConfig[],
): RegistrationFormValues =>
  registration === null
    ? steps.reduce<RegistrationFormValues>(
        (values, step) => ({ ...values, ...stepDefaultValues(step) }),
        { comment: "", guests: 0, eventIds: [] },
      )
    : {
        comment: registration.competing.comment ?? "",
        guests: registration.guests ?? 0,
        eventIds: registration.competing.event_ids,
      };

/**
 * The form belongs to the lane rather than to the step that draws it: the competing step is mounted
 * and unmounted as the competitor moves between their registration summary and the form, and what
 * they have typed has to outlive that. Callers reset it to `registrationFormValues` whenever they
 * hand the form back to the competitor.
 */
export function useRegistrationForm({
  registration,
  steps,
  onSubmit,
}: {
  registration: Registration | null;
  steps: StepConfig[];
  onSubmit: (values: RegistrationFormValues, onSubmitted: () => void) => void;
}) {
  return useForm({
    defaultValues: registrationFormValues(registration, steps),
    // Where the competitor goes once the submission went through is up to whoever drew the form.
    onSubmitMeta: { onSubmitted: () => {} },
    onSubmit: ({ value, meta }) => onSubmit(value, meta.onSubmitted),
  });
}

export type RegistrationForm = ReturnType<typeof useRegistrationForm>;
