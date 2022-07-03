import React, { useCallback, useState } from 'react';
import { Form, Label } from 'semantic-ui-react';

// https://www.worldcubeassociation.org/regulations/#E2d1
const MAX_FMC_SOLUTION_LENGTH = 80;

export default function MovesInput({
  moves: initialMoves, isAverage, onChange,
}) {
  const [moves, setMoves] = useState(isAverage ? initialMoves / 100 : initialMoves);

  const handleChange = useCallback((e) => {
    setMoves(e.target.value);

    const parsedMoves = parseFloat(moves, 10);

    if (parsedMoves) {
      if (isAverage) {
        onChange(parsedMoves * 100);
      } else {
        onChange(parsedMoves);
      }
    }
  }, [onChange]);

  return (
    <Form.Field>
      <input
        type="number"
        min={1}
        max={MAX_FMC_SOLUTION_LENGTH}
        step={isAverage ? 0.01 : 1}
        autoFocus
        value={moves}
        onChange={handleChange}
      />
      <Label pointing>moves</Label>
    </Form.Field>
  );
}
