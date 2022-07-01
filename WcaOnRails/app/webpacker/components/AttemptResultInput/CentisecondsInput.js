import React, { useCallback } from 'react';
import { Input } from 'semantic-ui-react';
import useInputState from '../../lib/hooks/useInputState';

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

const buildCentiseconds = ({ minutes, seconds, centiseconds }) => {
  if (minutes === null && seconds === null && centiseconds === null) {
    return null;
  }

  return minutes * MINUTE_IN_CS + seconds * SECOND_IN_CS + centiseconds;
};

export default function CentisecondsInput({
  id, centiseconds: initialCentiseconds, onChange, autoFocus,
}) {
  const parsedCentiSeconds = parseCentiseconds(initialCentiseconds);

  const [minutes, setMinutes] = useInputState(parsedCentiSeconds.minutes);
  const [seconds, setSeconds] = useInputState(parsedCentiSeconds.minutes);
  const [centiseconds, setCentiseconds] = useInputState(parsedCentiSeconds.minutes);

  const onInputChange = useCallback((inputHandler) => (ev, data) => {
    inputHandler(ev, data);
    onChange(buildCentiseconds({ minutes, seconds, centiseconds }));
  }, [onChange]);

  return (
    <div>
      <Input
        type="number"
        id={id}
        name="minutes"
        className="form-control"
        autoFocus={autoFocus}
        value={minutes}
        min={0}
        onChange={onInputChange(setMinutes)}
      />
      minutes

      <Input
        type="number"
        name="seconds"
        className="form-control"
        value={seconds}
        min={0}
        max={59}
        onChange={onInputChange(setSeconds)}
      />
      seconds

      <Input
        type="number"
        name="centiseconds"
        className="form-control"
        value={centiseconds}
        min={0}
        max={99}
        onChange={onInputChange(setCentiseconds)}
      />
      centiseconds
    </div>
  );
}
