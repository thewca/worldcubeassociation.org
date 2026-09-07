import { LiveRound } from "@/types/live";

// Completed and empty results do not have forecast statistics.
export const countCompletedResults = (round: LiveRound) =>
  round.results.filter((r) => !r.forecast_statistics && r.attempts.length > 0)
    .length;
