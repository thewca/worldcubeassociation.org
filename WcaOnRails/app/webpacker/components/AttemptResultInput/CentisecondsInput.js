import React, { useCallback, useState } from 'react';
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

  const [minutes, setMinutes] = useState(parsedCentiSeconds.minutes);
  const [seconds, setSeconds] = useState(parsedCentiSeconds.minutes);
  const [centiseconds, setCentiseconds] = useState(parsedCentiSeconds.minutes);

  const onInputChange = useCallback((inputHandler) => (e) => {
    inputHandler(e.target.value);

    const parsedMinutes = parseInt(minutes, 10);
    const parsedSeconds = parseInt(seconds, 10);
    const parsedCentiseconds = parseInt(centiseconds, 10);

    // If the inputs are parsed correctly
    if (minutes && seconds && centiseconds) {
      onChange(buildCentiseconds({
        minutes: parsedMinutes,
        seconds: parsedSeconds,
        centiseconds: parsedCentiseconds,
      }));
    }
  }, [onChange]);

  return (
    <Form.Group grouped>
      <Form.Field>
        <input
          type="number"
          name="minutes"
          value={minutes}
          min={0}
          onChange={onInputChange(setMinutes)}
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
          onChange={onInputChange(setSeconds)}
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
          onChange={onInputChange(setCentiseconds)}
        />
        <Label pointing>centiseconds</Label>
      </Form.Field>
    </Form.Group>
  );
}
