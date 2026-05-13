import { components } from "@/types/openapi";
import _ from "lodash";

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
    | components["schemas"]["Record"]
    | components["schemas"]["ExtendedResult"],
) {
  return cleanAttempts(record.attempts);
}
