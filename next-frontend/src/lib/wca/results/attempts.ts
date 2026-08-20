import { components } from "@/types/openapi";
import _ from "lodash";
import { DNF_VALUE, SKIPPED_VALUE } from "@/lib/wca/wcif/attempts";

function isComplete(attemptResult: number) {
  return attemptResult > 0;
}

function isSkipped(attemptResult: number) {
  return attemptResult === SKIPPED_VALUE;
}

function compareAttemptResults(attemptResult1: number, attemptResult2: number) {
  if (!isComplete(attemptResult1) && !isComplete(attemptResult2)) return 0;
  if (!isComplete(attemptResult1) && isComplete(attemptResult2)) return 1;
  if (isComplete(attemptResult1) && !isComplete(attemptResult2)) return -1;
  return attemptResult1 - attemptResult2;
}

function mean(x: number, y: number, z: number) {
  return Math.round((x + y + z) / 3);
}

function meanOf3(attemptResults: number[]) {
  if (!attemptResults.every(isComplete)) return DNF_VALUE;
  const [x, y, z] = attemptResults;
  return mean(x, y, z);
}

function averageOf5(attemptResults: number[]) {
  const [, x, y, z] = attemptResults.slice().sort(compareAttemptResults);
  return meanOf3([x, y, z]);
}

/* See: https://www.worldcubeassociation.org/regulations/#9f2 */
function roundOver10Mins(value: number) {
  if (!isComplete(value)) return value;
  if (value <= 10 * 6000) return value;
  return Math.round(value / 100) * 100;
}

/**
 * Returns the best attempt result from the given list.
 *
 * @example
 * best([900, -1, 700]); // => 700
 */
export function best(attemptResults: number[]): number {
  const nonSkipped = attemptResults.filter((attempt) => !isSkipped(attempt));
  const completeAttempts = attemptResults.filter(isComplete);

  if (nonSkipped.length === 0) return SKIPPED_VALUE;
  if (completeAttempts.length === 0) return Math.max(...nonSkipped);
  return Math.min(...completeAttempts);
}

/**
 * Returns the average of the given attempt results.
 *
 * Calculates either Mean of 3 or Average of 5 depending on
 * the number of the given attempt results.
 *
 * @example
 * average([900, -1, 700, 800, 900], '333'); // => 800
 * average([900, -1, 700, 800, -1], '333'); // => -1
 */
export function average(attemptResults: number[], eventId: string): number {
  if (!eventId) {
    /* If eventId is omitted, the average is still calculated correctly except for FMC
       and that may be a hard to spot bug, so better enforce explicity here. */
    throw new Error("Missing argument: eventId");
  }

  if (eventId === "333mbf" || eventId === "333mbo") return SKIPPED_VALUE;

  if (attemptResults.some(isSkipped)) return SKIPPED_VALUE;

  if (eventId === "333fm") {
    const scaled = attemptResults.map((attemptResult) => attemptResult * 100);
    switch (attemptResults.length) {
      case 1:
      case 2:
        return SKIPPED_VALUE;
      case 3:
        return meanOf3(scaled);
      default:
        throw new Error(
          `Invalid number of attempt results, expected 1, 2, or 3, given ${attemptResults.length}.`,
        );
    }
  }

  switch (attemptResults.length) {
    case 3:
      return roundOver10Mins(meanOf3(attemptResults));
    case 5:
      return roundOver10Mins(averageOf5(attemptResults));
    default:
      throw new Error(
        `Invalid number of attempt results, expected 3 or 5, given ${attemptResults.length}.`,
      );
  }
}

function cleanAttempts(attempts: number[]) {
  const definedAttempts = attempts.filter((res) => res);

  const validAttempts = definedAttempts.filter((res) => res !== 0);
  const completedAttempts = validAttempts.filter((res) => res > 0);
  const uncompletedAttempts = validAttempts.filter((res) => res < 0);

  // DNF/DNS values are very small. If all solves were successful,
  //   then `uncompletedAttempts` is empty and the min is `undefined`,
  //   which means we fall back to the actually slowest value.
  const worstResult = _.min(uncompletedAttempts) || _.max(validAttempts);
  const bestResult = _.min(completedAttempts);

  const bestResultIndex = definedAttempts.indexOf(bestResult!);
  const worstResultIndex = definedAttempts.indexOf(worstResult!);

  return {
    definedAttempts,
    bestResultIndex,
    worstResultIndex,
  };
}

export function resultAttempts(result: components["schemas"]["Result"]) {
  return cleanAttempts(result.attempts);
}

export function recordAttempts(
  record:
    components["schemas"]["Record"] | components["schemas"]["ExtendedResult"],
) {
  return cleanAttempts(record.attempts);
}
