import React from 'react';
import { Form, Label } from 'semantic-ui-react';

import {
  mbPointsToAttemptResult,
  attemptResultToMbPoints,
} from '../../lib/utils/edit-events';

export default function MovesInput({
  points: initialPoints, onChange,
}) {
  const points = attemptResultToMbPoints(initialPoints);

  const handleChange = (e) => {
    const parsedInput = parseInt(e.target.value, 10);

    if (Number.isNaN(parsedInput) || parsedInput < 1) {
      return;
    }

    onChange(mbPointsToAttemptResult(parsedInput));
  };

  return (
    <Form.Field>
      <input
        type="number"
        min={1}
        value={points}
        onChange={handleChange}
        autoFocus
      />
      <Label pointing>points</Label>
    </Form.Field>
  );
}
