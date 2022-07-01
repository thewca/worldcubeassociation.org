import React, { useCallback } from 'react';
import { Input } from 'semantic-ui-react';
import useInputState from '../../lib/hooks/useInputState';

// https://www.worldcubeassociation.org/regulations/#E2d1
const MAX_FMC_SOLUTION_LENGTH = 80;

export default function MovesInput({
  id, moves: initialMoves, isAverage, onChange, autoFocus,
}) {
  const [moves, setMoves] = useInputState(initialMoves);

  const handleChange = useCallback((ev, data) => {
    setMoves(ev, data);
    onChange(moves);
  }, [onChange]);

  return (
    <div>
      <Input
        id={id}
        type="number"
        min={1}
        max={MAX_FMC_SOLUTION_LENGTH}
        step={isAverage ? 0.01 : 1}
        className="form-control"
        autoFocus={autoFocus}
        onChange={handleChange}
      />
      moves
    </div>
  );
}
