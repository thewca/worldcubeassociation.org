import { components } from "@/types/openapi";
import { hasPassed, hasPassedEndOfDay } from "@/lib/wca/dates";

type CompetitionDates = Pick<
  components["schemas"]["CompetitionIndex"],
  "start_date" | "end_date" | "results_posted_at"
>;

// Posted results end a competition early: the last day may still be running while the
// organizers have already uploaded, and at that point it is no longer "in progress".
export const isInProgress = (competition: CompetitionDates) =>
  hasPassed(competition.start_date) &&
  !hasPassedEndOfDay(competition.end_date) &&
  !competition.results_posted_at;

export type RegistrationStatus = "open" | "notOpen" | "closed";

type RegistrationDates = Pick<
  components["schemas"]["CompetitionIndex"],
  "registration_open" | "registration_close"
>;

export const getRegistrationStatus = (
  competition: RegistrationDates,
): RegistrationStatus => {
  if (!hasPassed(competition.registration_open)) {
    return "notOpen";
  }

  if (hasPassed(competition.registration_close)) {
    return "closed";
  }

  return "open";
};
