import React from 'react';
import { TableCell } from 'semantic-ui-react';

// eslint-disable-next-line import/prefer-default-export
export function AttemptItem({ result, attemptNumber }) {
  const attempt = result.attempts[attemptNumber];
  const best = result.bestIdx === attemptNumber;
  const worst = result.worstIdx === attemptNumber;

  const text = (best || worst) && result.trimmedIdx.includes(attemptNumber) ? `(${attempt})` : attempt;
  return (<TableCell>{text}</TableCell>);
}
