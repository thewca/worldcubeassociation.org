"use client";

import {
  Alert,
  Button,
  Field,
  Fieldset,
  HStack,
  List,
  NumberInput,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { FormEventSelector } from "@/components/EventSelector";
import { WCA_EVENT_IDS } from "@/lib/wca/data/events";
import {
  COMMENT_CHARACTER_LIMIT,
  DEFAULT_GUEST_LIMIT,
} from "@/lib/wca/data/wca";
import { useT } from "@/lib/i18n/useI18n";
import {
  disabledEventIds,
  preselectedEventIds,
} from "@/lib/wca/registrations/eventSelection";
import canEditRegistration from "@/lib/wca/registrations/canEditRegistration";
import { qualificationToString } from "@/lib/wca/wcif/rounds";
import type { components } from "@/types/openapi";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { LuSend, LuUndo2 } from "react-icons/lu";

type CompetitionInfo = components["schemas"]["CompetitionInfo"];
type CompetingStepParameters =
  components["schemas"]["CompetingStepConfig"]["parameters"];
type Registration = components["schemas"]["RegistrationDataV2"];

const { fieldContext, formContext } = createFormHookContexts();

const { useAppForm } = createFormHook({
  fieldComponents: {},
  formComponents: {},
  fieldContext,
  formContext,
});

export interface RegistrationFormValues {
  comment: string;
  guests: number;
  eventIds: string[];
}

const defaultFormValues = (
  registration: Registration | null,
  parameters: CompetingStepParameters,
): RegistrationFormValues => ({
  comment: registration?.competing.comment ?? "",
  guests: registration?.guests ?? 0,
  eventIds:
    registration?.competing.event_ids ?? preselectedEventIds(parameters),
});

const toggleEvent = (eventId: string, selectedEventIds: string[]) => {
  if (selectedEventIds.includes(eventId)) {
    return selectedEventIds.filter((evt) => evt != eventId);
  }

  const addedEvent = [...selectedEventIds, eventId];
  return WCA_EVENT_IDS.filter((evt) => addedEvent.includes(evt));
};

export default function CompetingStep({
  competitionInfo,
  parameters,
  registration,
  isSubmitting,
  onSubmit,
  onClose,
}: {
  competitionInfo: CompetitionInfo;
  parameters: CompetingStepParameters;
  registration: Registration | null;
  isSubmitting: boolean;
  onSubmit: (values: RegistrationFormValues) => void;
  // Only set when the form is opened from the registration overview, which is the one place the
  //   competitor can leave it again without submitting anything.
  onClose?: () => void;
}) {
  const { t } = useT();

  // Defaults only apply on mount, which is what we want: this component is mounted afresh every
  //   time the competitor opens the form, so it always starts from what is currently saved.
  const form = useAppForm({
    defaultValues: defaultFormValues(registration, parameters),
  });

  const maxEvents = parameters.events_per_registration_limit ?? Infinity;

  const eventsDisabled = disabledEventIds(parameters);

  // A competition's own guest limit only binds when it restricts guests in the first place;
  //   otherwise only the site-wide sanity cap applies.
  const guestsRestricted = parameters.guest_entry_status === "restricted";
  const guestLimit = guestsRestricted
    ? (parameters.guests_per_registration_limit ?? DEFAULT_GUEST_LIMIT)
    : DEFAULT_GUEST_LIMIT;

  const hasWithdrawn =
    registration?.competing.registration_status === "cancelled";

  const isEditingLocked =
    registration !== null && !canEditRegistration(parameters, registration);

  const warnings = [
    parameters.events_per_registration_limit &&
      t("competitions.registration_v2.register.event_limit", {
        max_events: parameters.events_per_registration_limit,
      }),
    competitionInfo["part_of_competition_series?"] &&
      t("competitions.competition_info.part_of_a_series"),
  ].filter((warning) => typeof warning === "string");

  const selectableEventIds = parameters.event_ids.filter(
    (eventId) => !eventsDisabled.includes(eventId),
  );

  const qualificationFor = (eventId: string) =>
    qualificationToString(t, parameters.qualification_wcif[eventId], eventId);

  const submitLabel =
    registration === null || hasWithdrawn
      ? t("registrations.register")
      : t("registrations.update");

  // Field validators only fire once a field has been touched, so the button needs its own check -
  //   otherwise an untouched form would submit an empty event list that the backend rejects.
  const isSubmittable = (values: RegistrationFormValues) =>
    values.eventIds.length > 0 &&
    values.eventIds.length <= maxEvents &&
    values.guests <= guestLimit &&
    (!parameters.force_comment_in_registration || values.comment.trim() !== "");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(form.state.values);
      }}
    >
      <Fieldset.Root disabled={isEditingLocked}>
        {warnings.length > 0 && (
          <Alert.Root status="warning">
            <Alert.Indicator />
            <Alert.Content>
              <List.Root>
                {warnings.map((warning) => (
                  <List.Item key={warning}>{warning}</List.Item>
                ))}
              </List.Root>
            </Alert.Content>
          </Alert.Root>
        )}

        {isEditingLocked && (
          <Alert.Root status="info">
            <Alert.Indicator />
            <Alert.Title>
              {t("competitions.registration_v2.register.editing_disabled")}
            </Alert.Title>
          </Alert.Root>
        )}

        <form.Field
          name="eventIds"
          validators={{
            onChange: ({ value, fieldApi }) =>
              value.length == 0 && fieldApi.state.meta.isDirty
                ? t("registrations.errors.must_register")
                : undefined,
          }}
        >
          {(field) => (
            <Fieldset.Root invalid={!field.state.meta.isValid}>
              <FormEventSelector
                title={t("competitions.competition_form.events")}
                wrap
                eventList={parameters.event_ids}
                selectedEvents={field.state.value}
                maxEvents={maxEvents}
                eventsDisabled={eventsDisabled}
                disabledText={qualificationFor}
                onEventClick={(eventId) =>
                  field.handleChange((prevSelected) =>
                    toggleEvent(eventId, prevSelected),
                  )
                }
                onAllClick={() => field.handleChange(selectableEventIds)}
                onClearClick={() => field.handleChange([])}
              />
              <Fieldset.ErrorText>
                {field.state.meta.errors.join(", ")}
              </Fieldset.ErrorText>
            </Fieldset.Root>
          )}
        </form.Field>

        {/* A required comment is derived from the value rather than validated on change, so that
            the competitor is told about it before they have typed anything. */}
        <form.Field name="comment">
          {(field) => {
            const commentMissing =
              parameters.force_comment_in_registration &&
              field.state.value.trim() === "";

            return (
              <Field.Root
                invalid={commentMissing}
                required={parameters.force_comment_in_registration}
              >
                <Field.Label width="full" asChild>
                  <HStack justify="space-between">
                    <Text>
                      {t("competitions.registration_v2.register.comment")}
                      <Field.RequiredIndicator />
                    </Text>
                    <Text fontStyle="italic">
                      ({field.state.value.length}/{COMMENT_CHARACTER_LIMIT})
                    </Text>
                  </HStack>
                </Field.Label>
                <Textarea
                  autoresize
                  maxLength={COMMENT_CHARACTER_LIMIT}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <Field.ErrorText>
                  {t("registrations.errors.cannot_register_without_comment")}
                </Field.ErrorText>
              </Field.Root>
            );
          }}
        </form.Field>

        {parameters.guests_enabled && (
          <form.Field
            name="guests"
            validators={{
              onChange: ({ value }) =>
                value > guestLimit
                  ? t("competitions.competition_info.guest_limit", {
                      count: guestLimit,
                    })
                  : undefined,
            }}
          >
            {(field) => (
              <Field.Root invalid={!field.state.meta.isValid}>
                <Field.Label>
                  {t("activerecord.attributes.registration.guests")}
                </Field.Label>
                <NumberInput.Root
                  value={field.state.value.toString()}
                  onValueChange={(e) => field.handleChange(e.valueAsNumber)}
                  min={0}
                  max={guestLimit}
                  width="full"
                >
                  <NumberInput.Input />
                  <NumberInput.Control />
                </NumberInput.Root>
                <Field.ErrorText>
                  {field.state.meta.errors.join(", ")}
                </Field.ErrorText>
              </Field.Root>
            )}
          </form.Field>
        )}

        {registration === null && (
          <Alert.Root status="info">
            <Alert.Indicator />
            <Alert.Title>
              {t("competitions.registration_v2.register.disclaimer")}
            </Alert.Title>
          </Alert.Root>
        )}

        {/* Opened from the overview with nothing changed there is nothing to submit, so the same
            button takes the competitor back to their summary instead of saving. */}
        <form.Subscribe
          selector={(state) =>
            onClose && state.isDefaultValue
              ? "close"
              : isSubmittable(state.values)
                ? "submit"
                : "incomplete"
          }
        >
          {(buttonAction) =>
            buttonAction === "close" ? (
              <Button
                width="full"
                variant="outline"
                colorPalette="blue"
                onClick={onClose}
              >
                <LuUndo2 />
                {t("competitions.registration_v2.register.view_registration")}
              </Button>
            ) : (
              <Button
                type="submit"
                width="full"
                colorPalette="green"
                loading={isSubmitting}
                disabled={buttonAction === "incomplete" || isEditingLocked}
              >
                <LuSend />
                {submitLabel}
              </Button>
            )
          }
        </form.Subscribe>
      </Fieldset.Root>
    </form>
  );
}
