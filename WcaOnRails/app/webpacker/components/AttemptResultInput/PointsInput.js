import React, { useCallback } from 'react';
import { Input } from 'semantic-ui-react';
import useInputState from '../../lib/hooks/useInputState';

import {
  mbPointsToAttemptResult,
  attemptResultToMbPoints,
} from '../../lib/utils/edit-events';

export default function MovesInput({
  id, points: initialPoints, onChange, autoFocus,
}) {
  const [points, setPoints] = useInputState(attemptResultToMbPoints(initialPoints));

  const handleChange = useCallback((ev, data) => {
    setPoints(ev, data);
    onChange(mbPointsToAttemptResult(points));
  }, [onChange]);

  return (
    <div>
      <Input
        type="number"
        min={1}
        id={id}
        className="form-control"
        autoFocus={autoFocus}
        value={points}
        onChange={handleChange}
      />
      points
    </div>
  );
}
