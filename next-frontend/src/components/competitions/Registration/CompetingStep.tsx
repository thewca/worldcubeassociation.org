import { PanelProps } from "@/app/(wca)/competitions/[competitionId]/register/StepPanelContents";
import { Field, Fieldset, NumberInput, Textarea } from "@chakra-ui/react";

export default function CompetingStep({ form, competitionInfo }: PanelProps) {
  return (
    <Fieldset.Root>
      <form.Field name="comment">
        {(field) => (
          <Field.Root invalid={!field.state.meta.isValid}>
            <Field.Label>Additional comment to the organizers</Field.Label>
            <Textarea
              autoresize
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <Field.ErrorText>{field.state.meta.errors.join(", ")}</Field.ErrorText>
          </Field.Root>
        )}
      </form.Field>
      <form.Field name="numberOfGuests">
        {(field) => (
          <Field.Root invalid={!field.state.meta.isValid}>
            <Field.Label>Guests</Field.Label>
            <NumberInput.Root
              value={field.state.value.toString()}
              onValueChange={(e) => field.handleChange(e.valueAsNumber)}
              min={0}
            >
              <NumberInput.Input />
              <NumberInput.Control />
            </NumberInput.Root>
            <Field.ErrorText>{field.state.meta.errors.join(", ")}</Field.ErrorText>
          </Field.Root>
        )}
      </form.Field>
    </Fieldset.Root>
  );
}
