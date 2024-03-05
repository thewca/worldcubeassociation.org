export const SKIPPED_VALUE = 0;
export const DNF_VALUE = -1;
export const DNS_VALUE = -2;

function isComplete(attemptResult) {
  return attemptResult > 0;
}

function isSkipped(attemptResult) {
  return attemptResult === SKIPPED_VALUE;
}

function compareAttemptResults(attemptResult1, attemptResult2) {
  if (!isComplete(attemptResult1) && !isComplete(attemptResult2)) return 0;
  if (!isComplete(attemptResult1) && isComplete(attemptResult2)) return 1;
  if (isComplete(attemptResult1) && !isComplete(attemptResult2)) return -1;
  return attemptResult1 - attemptResult2;
}

function mean(x, y, z) {
  return Math.round((x + y + z) / 3);
}

function meanOf3(attemptResults) {
  if (!attemptResults.every(isComplete)) return DNF_VALUE;
  return mean(...attemptResults);
}

function averageOf5(attemptResults) {
  const [, x, y, z] = attemptResults.slice().sort(compareAttemptResults);
  return meanOf3([x, y, z]);
}

/* See: https://www.worldcubeassociation.org/regulations/#9f2 */
function roundOver10Mins(value) {
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
export function best(attemptResults) {
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
export function average(attemptResults, eventId) {
  if (!eventId) {
    /* If eventId is omitted, the average is still calculated correctly except for FMC
       and that may be a hard to spot bug, so better enforce explicity here. */
    throw new Error('Missing argument: eventId');
  }

  if (eventId === '333mbf' || eventId === '333mbo') return SKIPPED_VALUE;

  if (attemptResults.some(isSkipped)) return SKIPPED_VALUE;

  if (eventId === '333fm') {
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

/**
 * Returns an object representation of the given MBLD attempt result.
 *
 * @example
 * decodeMbldAttemptResult(900348002); // => { solved: 11, attempted: 13, centiseconds: 348000 }
 */
export function decodeMbldAttemptResult(value) {
  if (value <= 0) return { solved: 0, attempted: 0, centiseconds: value };
  // Old-style results, written as a 10-digit number, start with a '1'.
  // New-style results start with a '0'.
  const isOldStyleResult = value.toString().padStart(10, '0').startsWith('1');
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

/**
 * Returns a MBLD attempt result based on the given object representation.
 *
 * @example
 * encodeMbldAttemptResult({ solved: 11, attempted: 13, centiseconds: 348000 }); // => 900348002
 */
export function encodeMbldAttemptResult({ solved, attempted, centiseconds }) {
  if (centiseconds <= 0) return centiseconds;
  const missed = attempted - solved;
  const points = solved - missed;
  const seconds = Math.round(
    (centiseconds || 9999900) / 100,
  ); /* 99999 seconds is used for unknown time. */
  return (99 - points) * 1e7 + seconds * 1e2 + missed;
}

/**
 * Converts centiseconds to a human-friendly string.
 */
export function centisecondsToClockFormat(centiseconds) {
  if (centiseconds == null) {
    return '?:??:??';
  }
  if (!Number.isFinite(centiseconds)) {
    throw new Error(
      `Invalid centiseconds, expected positive number, got ${centiseconds}.`,
    );
  }
  return new Date(centiseconds * 10)
    .toISOString()
    .substr(11, 11)
    .replace(/^[0:]*(?!\.)/g, '');
}

function formatMbldAttemptResult(attemptResult) {
  const { solved, attempted, centiseconds } = decodeMbldAttemptResult(
    attemptResult,
  );
  const clockFormat = centisecondsToClockFormat(centiseconds);
  const shortClockFormat = clockFormat.replace(/\.00$/, '');
  // u2002 is a special space character
  // using it here allows us to expand space between mbf results without
  //  expanding the spaces within the individual results
  // see https://github.com/thewca/worldcubeassociation.org/issues/6375
  return `${solved}/${attempted}\u2002${shortClockFormat}`;
}

function formatFmAttemptResult(attemptResult) {
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
export function formatAttemptResult(attemptResult, eventId) {
  if (attemptResult === SKIPPED_VALUE) return '';
  if (attemptResult === DNF_VALUE) return 'DNF';
  if (attemptResult === DNS_VALUE) return 'DNS';
  if (eventId === '333mbf' || eventId === '333mbo') return formatMbldAttemptResult(attemptResult);
  if (eventId === '333fm') return formatFmAttemptResult(attemptResult);
  return centisecondsToClockFormat(attemptResult);
}

export function formatAttemptsForResult(result, eventId) {
  // Only highlight best and worst if the number of unskipped attempts is 5.
  const highlightBestAndWorst = result.attempts.filter((a) => a !== 0).length === 5;
  return result.attempts.map((attempt, index) => {
    const attemptStr = formatAttemptResult(attempt, eventId);
    return highlightBestAndWorst && (result.best_index === index || result.worst_index === index)
      ? `(${attemptStr})` : attemptStr;
  }).join(' ');
}
