import React, { useCallback, useState } from 'react';
import { Form, Label } from 'semantic-ui-react';

import {
  mbPointsToAttemptResult,
  attemptResultToMbPoints,
} from '../../lib/utils/edit-events';

export default function MovesInput({
  points: initialPoints, onChange,
}) {
  const [points, setPoints] = useState(attemptResultToMbPoints(initialPoints));

  const handleChange = useCallback((e) => {
    setPoints(e.target.value);
    onChange(mbPointsToAttemptResult(points));
  }, [onChange]);

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
