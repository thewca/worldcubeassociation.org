import React from 'react';
import { Table } from 'semantic-ui-react';
import { formatAttemptResult } from '../../../lib/wca-live/attempts';

// eslint-disable-next-line import/prefer-default-export
export function AttemptItem({ result, attemptNumber }) {
  if (result.attempts.length <= attemptNumber) {
    return <Table.Cell />;
  }

  const attemptRaw = result.attempts[attemptNumber];
  const attemptClock = formatAttemptResult(attemptRaw, result.event_id);

  const isBest = result.best_index === attemptNumber;
  const isWorst = result.worst_index === attemptNumber;

  const text = (isBest || isWorst) && result.trimmed_indices.includes(attemptNumber)
    ? `(${attemptClock})`
    : ` ${attemptClock} `;

  return (
    <Table.Cell textAlign="right">{text}</Table.Cell>
  );
}
