import React from 'react';
import { Form, Label } from 'semantic-ui-react';

// https://www.worldcubeassociation.org/regulations/#E2d1
const MAX_FMC_SOLUTION_LENGTH = 80;

export default function MovesInput({
  moves: initialMoves, isAverage, onChange,
}) {
  const moves = isAverage ? initialMoves / 100 : initialMoves;

  const handleChange = (e) => {
    const parsedInput = parseFloat(e.target.value, 10);

    if (Number.isNaN(parsedInput) || parsedInput < 1) {
      return;
    }

    if (parsedInput) {
      if (isAverage) {
        onChange(parsedInput * 100);
      } else {
        onChange(parsedInput);
      }
    }
  };

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
