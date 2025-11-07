"use client"

import { PanelProps } from "@/app/(wca)/competitions/[competitionId]/register/StepPanelContents";
import { Field, Fieldset, NumberInput, Textarea, Text } from "@chakra-ui/react";
import EventSelector from "@/components/EventSelector";
import {WCA_EVENT_IDS} from "@/lib/wca/data/events";
import {useT} from "@/lib/i18n/useI18n";

const toggleEvent = (eventId: string, selectedEventIds: string[]) => {
  if (selectedEventIds.includes(eventId)) {
    return selectedEventIds.filter((evt) => evt != eventId);
  }

  const addedEvent = [...selectedEventIds, eventId];
  return WCA_EVENT_IDS.filter((evt) => addedEvent.includes(evt));
}

export default function CompetingStep({ form, competitionInfo }: PanelProps) {
  const { t } = useT();

  return (
    <Fieldset.Root>
      <form.Field name="eventIds" validators={{
        onChange: ({ value, fieldApi }) => value.length == 0 && fieldApi.state.meta.isDirty ? t('registrations.errors.must_register') : undefined,
      }}>
        {(field) => (
          <EventSelector
            title="Hello"
            eventList={competitionInfo.event_ids}
            selectedEvents={field.state.value}
            onEventClick={(eventId) => field.handleChange((prevSelected) => toggleEvent(eventId, prevSelected))}
          />
        )}
      </form.Field>
      <form.Field name="comment">
        {(field) => (
          <Field.Root invalid={!field.state.meta.isValid}>
            <Field.Label>Additional comments to the organizers</Field.Label>
            <Textarea
              autoresize
              maxLength={240}
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
              max={99}
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
