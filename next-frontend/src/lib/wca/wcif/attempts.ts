import type { components } from "@/types/openapi";

type AttemptResult = components["schemas"]["WcifAttemptResult"];

export const SKIPPED_VALUE = 0;
export const DNF_VALUE = -1;
export const DNS_VALUE = -2;

/**
 * Converts centiseconds to a human-friendly string.
 */
export function centisecondsToClockFormat(centiseconds: number): string {
  if (centiseconds == null) {
    return "?:??:??";
  }

  if (!Number.isFinite(centiseconds)) {
    throw new Error(
      `Invalid centiseconds, expected positive number, got ${centiseconds}.`,
    );
  }

  return new Date(centiseconds * 10)
    .toISOString()
    .slice(11, 22)
    .replace(/^[0:]*(?!\.)/g, "");
}

interface MbldInternal {
  solved: number;
  attempted: number;
  timeSeconds: number;
}

function parseMbldInternal(val: number, isOldFormat: boolean): MbldInternal {
  if (isOldFormat) {
    const timeSeconds = val % 100_000;
    const valAfterTime = Math.floor(val / 100_000);
    const attempted = valAfterTime % 100;
    const valAfterAttempted = Math.floor(valAfterTime / 100);
    const solved = 99 - (valAfterAttempted % 100);

    return { solved, attempted, timeSeconds };
  } else {
    const missed = val % 100;
    const valAfterMissed = Math.floor(val / 100);
    const timeSeconds = valAfterMissed % 100_000;
    const valAfterTime = Math.floor(valAfterMissed / 100_000);
    const difference = 99 - (valAfterTime % 100);
    const solved = difference + missed;
    const attempted = solved + missed;

    return { solved, attempted, timeSeconds };
  }
}

export interface MultiBldResult {
  solved: number;
  attempted: number;
  timeCentiseconds?: number;
}

export function parseMbldResult(val: number): MultiBldResult {
  const isOldFormat = Math.floor(val / 1_000_000_000) !== 0;

  const extractedValues = parseMbldInternal(val, isOldFormat);

  const timeCentiseconds =
    extractedValues.timeSeconds === 99_999
      ? undefined
      : extractedValues.timeSeconds * 100;

  return {
    solved: extractedValues.solved,
    attempted: extractedValues.attempted,
    timeCentiseconds,
  };
}

export function decodeMbldAttemptResult(value: number) {
  if (value <= 0) return { solved: 0, attempted: 0, centiseconds: value };
  // Old-style results, written as a 10-digit number, start with a '1'.
  // New-style results start with a '0'.
  const isOldStyleResult = value.toString().padStart(10, "0").startsWith("1");
  if (isOldStyleResult) {
    const seconds = value % 1e5;
    const attempted = Math.floor(value / 1e5) % 100;
    const solved = 99 - (Math.floor(value / 1e7) % 100);
    const centiseconds = seconds === 99999 ? null : seconds * 100;
    return { solved, attempted, centiseconds };
  }
  const missed = value % 100;
  const seconds = Math.floor(value / 100) % 1e5;
  const points = 99 - (Math.floor(value / 1e7) % 100);
  const solved = points + missed;
  const attempted = solved + missed;
  const centiseconds = seconds === 99999 ? null : seconds * 100;
  return { solved, attempted, centiseconds };
}

// See https://www.worldcubeassociation.org/regulations/#9f12c
export function attemptResultToMbldPoints(attemptResult: AttemptResult) {
  const { solved, attempted } = parseMbldResult(attemptResult);
  const missed = attempted - solved;
  return solved - missed;
}

export function formatAttemptsForResult(
  result: { attempts: number[]; best_index: number; worst_index: number },
  eventId: string,
) {
  // Only highlight best and worst if the number of unskipped attempts is 5.
  const highlightBestAndWorst =
    result.attempts.filter((a) => a !== 0).length === 5;
  return result.attempts
    .map((attempt, index) => {
      const attemptStr = formatAttemptResult(attempt, eventId);
      return highlightBestAndWorst &&
        (result.best_index === index || result.worst_index === index)
        ? `(${attemptStr})`
        : attemptStr;
    })
    .join(" ");
}

function formatMbldAttemptResult(attemptResult: number) {
  const { solved, attempted, timeCentiseconds } =
    parseMbldResult(attemptResult);
  const clockFormat = centisecondsToClockFormat(timeCentiseconds!);
  const shortClockFormat = clockFormat.replace(/\.00$/, "");
  // u2002 is a special space character
  // using it here allows us to expand space between mbf results without
  //  expanding the spaces within the individual results
  // see https://github.com/thewca/worldcubeassociation.org/issues/6375
  return `${solved}/${attempted}\u2002${shortClockFormat}`;
}

function formatFmAttemptResult(attemptResult: number) {
  /* Note: FM singles are stored as the number of moves (e.g. 25),
     while averages are stored with 2 decimal places (e.g. 2533 for an average of 25.33 moves). */
  const isAverage = attemptResult >= 1000;
  return isAverage
    ? (attemptResult / 100).toFixed(2)
    : attemptResult.toString();
}

/**
 * Converts the given attempt result to a human-friendly string.
 *
 * @example
 * formatAttemptResult(-1, '333'); // => 'DNF'
 * formatAttemptResult(6111, '333'); // => '1:01.11'
 * formatAttemptResult(900348002, '333mbf'); // => '11/13 58:00'
 */
export function formatAttemptResult(attemptResult: number, eventId: string) {
  if (attemptResult === SKIPPED_VALUE) return "";
  if (attemptResult === DNF_VALUE) return "DNF";
  if (attemptResult === DNS_VALUE) return "DNS";
  if (eventId === "333mbf" || eventId === "333mbo")
    return formatMbldAttemptResult(attemptResult);
  if (eventId === "333fm") return formatFmAttemptResult(attemptResult);
  return centisecondsToClockFormat(attemptResult);
}
