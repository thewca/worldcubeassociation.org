import {
  DNF_VALUE,
  DNS_VALUE,
  formatAttemptResult,
  SKIPPED_VALUE,
} from "@/lib/wca/wcif/attempts";
import { decodeMbldAttemptResult } from "../../../../app/webpacker/lib/wca-live/attempts";
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
    return {
      description: `You've omitted attempt ${
        skippedGapIndex + 1
      }. Make sure it's intentional.`,
    };
  }
  const completeAttempts = attemptResults.filter((a) => a !== SKIPPED_VALUE);
  if (completeAttempts.length > 0) {
    const bestSingle = Math.min(...completeAttempts);
    if (checkForDnsFollowedByValidResult(attemptResults)) {
      return {
        description: `There's at least one DNS followed by a valid result. Please ensure it is indeed a DNS and not a DNF.`,
      };
    }

    if (eventId === "333mbf") {
      const lowTimeIndex = attemptResults.findIndex((attempt) => {
        const { attempted, centiseconds } = decodeMbldAttemptResult(attempt);
        return attempt > 0 && centiseconds / attempted < 30 * 100;
      });
      if (lowTimeIndex !== -1) {
        return {
          description: `The result you're trying to submit seems to be impossible:
            attempt ${lowTimeIndex + 1} is done in
            less than 30 seconds per cube tried.
            If you want to enter minutes, don't forget to add two zeros
            for centiseconds at the end of the score.`,
        };
      }
    } else {
      const worstSingle = Math.max(...completeAttempts);
      const inconsistent = worstSingle > bestSingle * 4;
      if (inconsistent) {
        return {
          description: `The result you're trying to submit seem to be inconsistent.
            There's a big difference between the best single
            (${formatAttemptResult(bestSingle, eventId)}) and the worst single
            (${formatAttemptResult(worstSingle, eventId)}).
            Please check that the results are accurate.`,
        };
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
