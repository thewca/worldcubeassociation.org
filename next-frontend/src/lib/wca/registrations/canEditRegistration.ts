import type { components } from "@/types/openapi";

type CompetingStepParameters =
  components["schemas"]["CompetingStepConfig"]["parameters"];
type Registration = components["schemas"]["RegistrationDataV2"];

/**
 * Whether the competitor may still change what they signed up for. Organizers keep editing open
 * for pending and waitlisted competitors even when the competition as a whole no longer allows
 * changes, and a withdrawn competitor may always sign up again - but a rejected one has nothing
 * left to do but read the outcome.
 */
export default function canEditRegistration(
  parameters: CompetingStepParameters,
  registration: Registration,
) {
  switch (registration.competing.registration_status) {
    case "rejected":
      return false;
    case "cancelled":
    case "pending":
    case "waiting_list":
      return true;
    default:
      return parameters.allow_registration_edits;
  }
}
