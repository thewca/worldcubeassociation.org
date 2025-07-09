import type { components } from "@/types/openapi";

type AttemptResult = components["schemas"]["WcifAttemptResult"];

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

// See https://www.worldcubeassociation.org/regulations/#9f12c
export function attemptResultToMbldPoints(attemptResult: AttemptResult) {
  const { solved, attempted } = parseMbldResult(attemptResult);
  const missed = attempted - solved;
  return solved - missed;
}
