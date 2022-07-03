import React from 'react';

import events from '../../lib/wca-data/events.js.erb';
import CentisecondsInput from './CentisecondsInput';
import MovesInput from './MovesInput';
import PointsInput from './PointsInput';

/**
 * Static component thatrenders different inputs for an attempt result based on the eventId.
 *
 * @component
 * @param {string} id - Represents the id on the input props
 * @param {string} eventId - The eventId to render the input for
 * @param {boolean} autoFocus - Whether to autofocus the input
 * @param {boolean} isAverage - Whether the inp
 */
export default function AttemptResultInput({
  id, eventId, isAverage, value, onChange,
}) {
  const event = events.byId[eventId];

  if (event.isTimedEvent) {
    return (
      <CentisecondsInput
        id={id}
        centiseconds={value}
        onChange={onChange}
      />
    );
  }

  if (event.isFewestMoves) {
    return (
      <MovesInput
        id={id}
        isAverage={isAverage}
        moves={isAverage ? value / 100 : value}
        onChange={onChange}
      />
    );
  }

  if (event.isMultipleBlindfolded) {
    return (
      <PointsInput
        id={id}
        points={value}
        onChange={onChange}
      />
    );
  }

  throw new Error(`Unrecognized event type: ${event.id}`);
}
