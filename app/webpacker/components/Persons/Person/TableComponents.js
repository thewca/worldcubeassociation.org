import React from 'react';
import { TableCell } from 'semantic-ui-react';
import { formatAttemptResult } from '../../../lib/wca-live/attempts';

// eslint-disable-next-line import/prefer-default-export
export function AttemptItem({ result, attemptNumber }) {
  if (result.attempts.length <= attemptNumber) {
    return <TableCell />;
  }

  const attemptRaw = result.attempts[attemptNumber];
  const attemptClock = formatAttemptResult(attemptRaw, result.eventId);

  const isBest = result.bestIdx === attemptNumber;
  const isWorst = result.worstIdx === attemptNumber;

  const text = (isBest || isWorst) && result.trimmedIdx.includes(attemptNumber)
    ? `(${attemptClock})`
    : ` ${attemptClock} `;

  return (
    <TableCell textAlign="right">{text}</TableCell>
  );
}
