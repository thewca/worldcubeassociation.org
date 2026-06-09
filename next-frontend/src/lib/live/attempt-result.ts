import {
  decodeMbldResult,
  DNF_VALUE,
  DNS_VALUE,
  formatAttemptResult,
  SKIPPED_VALUE,
} from "@/lib/wca/wcif/attempts";
import { WcifCutoff, WcifTimeLimit } from "@/lib/wca/wcif/rounds";
import { TFunction } from "i18next";

/**
 * Removes trailing skipped attempt results from the given list.
 */
export function trimTrailingSkipped(attemptResults: number[]) {
  if (attemptResults.length === 0) return [];
  if (attemptResults[attemptResults.length - 1] === SKIPPED_VALUE) {
    return trimTrailingSkipped(attemptResults.slice(0, -1));
  }
  return attemptResults;
}

/**
 * Alters the given MBLD decoded value, so that it conforms to the WCA regulations.
 */
export function autocompleteMbldDecodedValue({
  attempted,
  solved,
  timeCentiseconds = 0,
}: {
  attempted: number;
  solved: number;
  timeCentiseconds?: number;
}) {
  // We expect the values to be entered left-to-right, so we reset to
  // defaults otherwise
  if (
    (!solved && attempted) ||
    (!solved && !attempted && timeCentiseconds > 0)
  ) {
    return { solved: 0, attempted: 0, timeCentiseconds: 0 };
  }

  if (!attempted || solved > attempted) {
    return { solved, attempted: solved, timeCentiseconds: timeCentiseconds };
  }
  // See https://www.worldcubeassociation.org/regulations/#9f12c
  if (solved < attempted / 2 || solved <= 1) {
    return { solved: 0, attempted: 0, timeCentiseconds: DNF_VALUE };
  }
  // See https://www.worldcubeassociation.org/regulations/#H1b
  // But allow additional two +2s per cube over the limit, just in case.
  if (
    timeCentiseconds >
    10 * 60 * 100 * Math.min(6, attempted) + attempted * 2 * 2 * 100
  ) {
    return { solved: 0, attempted: 0, timeCentiseconds: DNF_VALUE };
  }
  return { solved, attempted, timeCentiseconds };
}

/**
 * Alters the given FM attempt result, so that it conforms to the WCA regulations.
 */
export function autocompleteFmAttemptResult(moves: number) {
  // See https://www.worldcubeassociation.org/regulations/#E2d1
  if (moves > 80) return DNF_VALUE;
  return moves;
}

/**
 * Alters the given time attempt result, so that it conforms to the WCA regulations.
 */
export function autocompleteTimeAttemptResult(time: number) {
  // See https://www.worldcubeassociation.org/regulations/#9f2
  return truncateOver10Mins(time);
}

/* See: https://www.worldcubeassociation.org/regulations/#9f2 */
function truncateOver10Mins(value: number) {
  if (value < 0) return value;
  if (value <= 10 * 6000) return value;
  return Math.floor(value / 100) * 100;
}

/**
 * Checks the given attempt results for discrepancies and returns
 * a warning message if some are found.
 */
export function attemptResultsWarning(
  attemptResults: number[],
  eventId: string,
  t: TFunction,
) {
  const skippedGapIndex =
    trimTrailingSkipped(attemptResults).indexOf(SKIPPED_VALUE);
  if (skippedGapIndex !== -1) {
    return t("competitions.live.admin.warnings.omitted", {
      attempt_number: skippedGapIndex + 1,
    });
  }
  const completeAttempts = attemptResults.filter((a) => a > SKIPPED_VALUE);
  if (completeAttempts.length > 0) {
    const bestSingle = Math.min(...completeAttempts);
    if (checkForDnsFollowedByValidResult(attemptResults)) {
      return t("competitions.live.admin.warnings.DNS");
    }

    if (eventId === "333mbf") {
      const lowTimeIndex = attemptResults.findIndex((attempt) => {
        const { attempted, timeCentiseconds } = decodeMbldResult(attempt);
        return attempt > 0 && timeCentiseconds! / attempted < 30 * 100;
      });
      if (lowTimeIndex !== -1) {
        return t("competitions.live.admin.warnings.impossible", {
          attempt_number: lowTimeIndex + 1,
        });
      }
    } else {
      const worstSingle = Math.max(...completeAttempts);
      const inconsistent = worstSingle > bestSingle * 4;
      if (inconsistent) {
        return t("competitions.live.admin.warnings.inconsistent", {
          best_single: formatAttemptResult(bestSingle, eventId),
          worst_single: formatAttemptResult(worstSingle, eventId),
        });
      }
    }
  }
  return null;
}

/**
 * Alters the given attempt results, so that they conform to the given time limit.
 */
export function applyTimeLimit(
  attemptResults: number[],
  timeLimit?: WcifTimeLimit,
) {
  if (timeLimit === undefined) return attemptResults;
  if (timeLimit.cumulativeRoundIds.length === 0) {
    return attemptResults.map((attemptResult) =>
      attemptResult >= timeLimit.centiseconds ? DNF_VALUE : attemptResult,
    );
  } else {
    // Note: for now cross-round cumulative time limits are handled
    // as single-round cumulative time limits for each of the rounds.
    const [updatedAttemptResults] = attemptResults.reduce(
      ([updatedAttemptResults, sum], attemptResult) => {
        const updatedSum = attemptResult > 0 ? sum + attemptResult : sum;
        const updatedAttemptResult =
          attemptResult > 0 && updatedSum >= timeLimit.centiseconds
            ? DNF_VALUE
            : attemptResult;
        return [updatedAttemptResults.concat(updatedAttemptResult), updatedSum];
      },
      [[] as number[], 0],
    );
    return updatedAttemptResults;
  }
}

/**
 * Alters the given attempt results, so that they conform to the given cutoff.
 */
export function applyCutoff(attemptResults: number[], cutoff?: WcifCutoff) {
  if (meetsCutoff(attemptResults, cutoff)) {
    return attemptResults;
  }
  // meets cutoff will return true if cutoff is undefined
  return attemptResults.map((attemptResult, index) =>
    index < cutoff!.numberOfAttempts ? attemptResult : SKIPPED_VALUE,
  );
}

/**
 * Checks if the given attempt results meet the given cutoff.
 */
export function meetsCutoff(attemptResults: number[], cutoff?: WcifCutoff) {
  if (!cutoff) return true;
  const { numberOfAttempts, attemptResult } = cutoff;
  return attemptResults
    .slice(0, numberOfAttempts)
    .some((attempt) => attempt > 0 && attempt < attemptResult);
}

function checkForDnsFollowedByValidResult(attemptResults: number[]) {
  const dnsIndex = attemptResults.findIndex((attempt) => attempt === DNS_VALUE);
  if (dnsIndex === -1) return false;
  return attemptResults.some(
    (attempt, index) =>
      index > dnsIndex && attempt !== SKIPPED_VALUE && attempt !== DNS_VALUE,
  );
}
