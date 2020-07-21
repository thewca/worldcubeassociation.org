export const trimTrailingZeros = (array) => {
  if (array.length === 0) return [];
  return array[array.length - 1] === 0
    ? trimTrailingZeros(array.slice(0, -1))
    : array;
};

export const centisecondsToClockFormat = (centiseconds) => {
  if (!Number.isFinite(centiseconds)) return null;
  if (centiseconds === 0) return '';
  if (centiseconds === -1) return 'DNF';
  if (centiseconds === -2) return 'DNS';
  return new Date(centiseconds * 10)
    .toISOString()
    .substr(11, 11)
    .replace(/^[0:]*(?!\.)/g, '');
};

export const decodeMbldAttempt = (value) => {
  if (value <= 0) return { solved: 0, attempted: 0, centiseconds: value };
  const missed = value % 100;
  const seconds = Math.floor(value / 100) % 1e5;
  const points = 99 - (Math.floor(value / 1e7) % 100);
  const solved = points + missed;
  const attempted = solved + missed;
  const centiseconds = seconds === 99999 ? null : seconds * 100;
  return { solved, attempted, centiseconds };
};

export const encodeMbldAttempt = ({ solved, attempted, centiseconds }) => {
  if (centiseconds <= 0) return centiseconds;
  const missed = attempted - solved;
  const points = solved - missed;
  const seconds = Math.round(
    (centiseconds || 9999900) / 100,
  ); /* 99999 seconds is used for unknown time. */
  return (99 - points) * 1e7 + seconds * 1e2 + missed;
};

export const validateMbldAttempt = ({ attempted, solved, centiseconds }) => {
  if (!attempted || solved > attempted) {
    return { solved, attempted: solved, centiseconds };
  }
  if (solved < attempted / 2 || solved <= 1) {
    return { solved: 0, attempted: 0, centiseconds: -1 };
  }
  /* Allow additional (arbitrary) 30 seconds over the limit for +2s. */
  if (centiseconds > 10 * 60 * 100 * Math.min(6, attempted) + 30 * 100) {
    return { solved: 0, attempted: 0, centiseconds: -1 };
  }
  return { solved, attempted, centiseconds };
};

export const mbldAttemptToPoints = (attempt) => {
  const { solved, attempted } = decodeMbldAttempt(attempt);
  const missed = attempted - solved;
  return solved - missed;
};

export const meetsCutoff = (attempts, cutoff) => {
  if (!cutoff) return true;
  const { numberOfAttempts, attemptResult } = cutoff;
  return attempts
    .slice(0, numberOfAttempts)
    .some((attempt) => attempt > 0 && attempt < attemptResult);
};

const formatMbldAttempt = (attempt) => {
  const { solved, attempted, centiseconds } = decodeMbldAttempt(attempt);
  const clockFormat = new Date(centiseconds * 10)
    .toISOString()
    .substr(11, 8)
    .replace(/^[0:]*(?!\.)/g, '');
  return `${solved}/${attempted} ${clockFormat}`;
};

export const formatAttemptResult = (
  attemptResult,
  eventId,
  isAverage = false,
) => {
  if (attemptResult === 0) return '';
  if (attemptResult === -1) return 'DNF';
  if (attemptResult === -2) return 'DNS';
  if (eventId === '333fm') {
    return isAverage
      ? (attemptResult / 100).toFixed(2)
      : attemptResult.toString();
  }
  if (eventId === '333mbf') return formatMbldAttempt(attemptResult);
  return centisecondsToClockFormat(attemptResult);
};

export const attemptsWarning = (attempts, eventId) => {
  const skippedGapIndex = trimTrailingZeros(attempts).indexOf(0);
  if (skippedGapIndex !== -1) {
    return `You've omitted attempt ${skippedGapIndex
      + 1}. Make sure it's intentional.`;
  }
  if (eventId === '333mbf') {
    const lowTimeIndex = attempts.findIndex((attempt) => {
      const { attempted, centiseconds } = decodeMbldAttempt(attempt);
      return attempt > 0 && centiseconds / attempted < 30 * 100;
    });
    if (lowTimeIndex !== -1) {
      return `
        The result you're trying to submit seems to be impossible:
        attempt ${lowTimeIndex + 1} is done in
        less than 30 seconds per cube tried.
        If you want to enter minutes, don't forget to add two zeros
        for centiseconds at the end of the score.
      `;
    }
  } else {
    const completeAttempts = attempts.filter((attempt) => attempt > 0);
    if (completeAttempts.length > 0) {
      const bestSingle = Math.min(...completeAttempts);
      const worstSingle = Math.max(...completeAttempts);
      const inconsistent = worstSingle > bestSingle * 4;
      if (inconsistent) {
        return `
          The result you're trying to submit seem to be inconsistent.
          There's a big difference between the best single
          (${formatAttemptResult(bestSingle, eventId)}) and the worst single
          (${formatAttemptResult(worstSingle, eventId)}).
          Please check that the results are accurate.
        `;
      }
    }
  }
  return null;
};

export const applyTimeLimit = (attempts, timeLimit) => {
  if (timeLimit === null) return attempts;
  if (timeLimit.cumulativeRoundIds.length === 0) {
    return attempts.map((attempt) => (attempt >= timeLimit.centiseconds ? -1 : attempt));
  }
  /* Note: for now cross-round cumulative time limits are handled
       as single-round cumulative time limits for each of the rounds. */
  const [newAttempts] = attempts.reduce(
    ([updatedAttempts, sum], attempt) => {
      const updatedSum = attempt > 0 ? sum + attempt : sum;
      const updatedAttempt = attempt > 0 && updatedSum >= timeLimit.centiseconds ? -1 : attempt;
      return [updatedAttempts.concat(updatedAttempt), updatedSum];
    },
    [[], 0],
  );
  return newAttempts;
};

export const applyCutoff = (attempts, cutoff) => (meetsCutoff(attempts, cutoff)
  ? attempts
  : attempts.map((attempt, index) => (index < cutoff.numberOfAttempts ? attempt : 0)));
