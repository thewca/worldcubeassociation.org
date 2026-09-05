import { eventsNotQualifiedFor } from "@/lib/wca/qualifications";
import type { components } from "@/types/openapi";

type CompetingStepParameters =
  components["schemas"]["CompetingStepConfig"]["parameters"];

// Events the competition holds but this competitor may not tick, because they have not met the
//   qualification the organizers enforce for them.
export function disabledEventIds(parameters: CompetingStepParameters) {
  if (parameters.allow_registration_without_qualification) {
    return [];
  }

  return eventsNotQualifiedFor(
    parameters.event_ids,
    parameters.qualification_wcif,
    parameters.personalRecords,
  );
}

/**
 * What a first-time registrant starts out with: the events they have marked as favourites, kept to
 * the ones they can actually enter here. Filtering matters because a disabled card cannot be
 * unticked again, and a selection over the competition's own limit cannot be submitted - seeding
 * either would strand the competitor on a form they cannot fix.
 *
 * Driven off `event_ids` rather than `preferredEvents` so the result comes out in the
 * competition's event order.
 */
export function preselectedEventIds(parameters: CompetingStepParameters) {
  const disabled = disabledEventIds(parameters);

  return parameters.event_ids
    .filter(
      (eventId) =>
        parameters.preferredEvents.includes(eventId) &&
        !disabled.includes(eventId),
    )
    .slice(0, parameters.events_per_registration_limit ?? Infinity);
}
