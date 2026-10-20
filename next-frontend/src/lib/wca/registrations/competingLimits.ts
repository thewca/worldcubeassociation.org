import { DEFAULT_GUEST_LIMIT } from "@/lib/wca/data/wca";
import type { components } from "@/types/openapi";

type CompetingStepParameters =
  components["schemas"]["CompetingStepConfig"]["parameters"];

export const eventLimit = (parameters: CompetingStepParameters) =>
  parameters.events_per_registration_limit ?? Infinity;

// A competition's own guest limit only binds when it restricts guests in the first place;
//   otherwise only the site-wide sanity cap applies.
export const guestLimit = (parameters: CompetingStepParameters) =>
  parameters.guest_entry_status === "restricted"
    ? (parameters.guests_per_registration_limit ?? DEFAULT_GUEST_LIMIT)
    : DEFAULT_GUEST_LIMIT;
