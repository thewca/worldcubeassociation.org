export const SKIPPED_VALUE = 0;
export const DNF_VALUE = -1;
export const DNS_VALUE = -2;

/**
 * Converts centiseconds to a human-friendly string.
 */
function centisecondsToClockFormat(centiseconds) {
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

/**
 * Returns an object representation of the given MBLD attempt result.
 *
 * @example
 * decodeMbldAttemptResult(900348002); // => { solved: 11, attempted: 13, centiseconds: 348000 }
 */
function decodeMbldAttemptResult(value) {
  if (value <= 0) return { solved: 0, attempted: 0, centiseconds: value };
  const missed = value % 100;
  const seconds = Math.floor(value / 100) % 1e5;
  const points = 99 - (Math.floor(value / 1e7) % 100);
  const solved = points + missed;
  const attempted = solved + missed;
  const centiseconds = seconds === 99999 ? null : seconds * 100;
  return { solved, attempted, centiseconds };
}

function formatMbldAttemptResult(attemptResult) {
  const { solved, attempted, centiseconds } = decodeMbldAttemptResult(
    attemptResult,
  );
  const clockFormat = centisecondsToClockFormat(centiseconds);
  const shortClockFormat = clockFormat.replace(/\.00$/, '');
  return `${solved}/${attempted} ${shortClockFormat}`;
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
