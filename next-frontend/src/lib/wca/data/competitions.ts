import _ from "lodash";

const currentYear = new Date().getFullYear();
const yearsRange = _.range(2003, currentYear, 1); // range end is exclusive

// Calling Ruby's `Competition.non_future_years` triggers a DB call, which we don't want.
// So we "fake" values by accepting that there was one competition in 1982 and then comps started in 2003 again.
export const nonFutureCompetitionYears = [1982, ...yearsRange, currentYear];
export const competitionConstants = {
  competitionRecentDays: 30,
};
