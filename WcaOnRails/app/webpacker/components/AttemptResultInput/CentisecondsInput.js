import React from 'react';
import { Form, Label } from 'semantic-ui-react';

import {
  MINUTE_IN_CS,
  SECOND_IN_CS,
} from '../../lib/utils/edit-events';

const parseCentiseconds = (centiseconds) => {
  if (centiseconds === null) {
    return null;
  }
  const minutes = Math.floor(centiseconds / MINUTE_IN_CS);
  const seconds = Math.floor((centiseconds % MINUTE_IN_CS) / SECOND_IN_CS);
  return {
    minutes,
    seconds,
    centiseconds: centiseconds - minutes * MINUTE_IN_CS - seconds * SECOND_IN_CS,
  };
};

const buildCentiseconds = ({ minutes, seconds, centiseconds }) => (
  minutes * MINUTE_IN_CS + seconds * SECOND_IN_CS + centiseconds
);

// TODO: Figure out how to inline labels with inputs

export default function CentisecondsInput({
  centiseconds: initialCentiseconds, onChange,
}) {
  const parsedCentiSeconds = parseCentiseconds(initialCentiseconds);
  const { minutes, seconds, centiseconds } = parsedCentiSeconds;

  const handleChange = (e) => {
    const parsedInput = parseInt(e.target.value, 10);

    if (Number.isNaN(parsedInput)) {
      return;
    }

    const newTime = {
      ...parsedCentiSeconds,
      [e.target.name]: parsedInput,
    };

    onChange(buildCentiseconds(newTime));
  };

  return (
    <Form.Group grouped>
      <Form.Field>
        <input
          type="number"
          name="minutes"
          value={minutes}
          min={0}
          onChange={handleChange}
          autoFocus
        />
        <Label pointing>minutes</Label>
      </Form.Field>

      <Form.Field>
        <input
          type="number"
          name="seconds"
          value={seconds}
          min={0}
          max={59}
          onChange={handleChange}
        />
        <Label pointing>seconds</Label>
      </Form.Field>

      <Form.Field>
        <input
          type="number"
          name="centiseconds"
          value={centiseconds}
          min={0}
          max={99}
          onChange={handleChange}
        />
        <Label pointing>centiseconds</Label>
      </Form.Field>
    </Form.Group>
  );
}
