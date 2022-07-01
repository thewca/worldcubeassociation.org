import React from 'react';

import events from '../../lib/wca-data/events.js.erb';
import CentisecondsInput from './CentisecondsInput';
import MovesInput from './MovesInput';
import PointsInput from './PointsInput';

/**
 * Renders different inputs for an attempt result based on the eventId.
 *
 * @component
 * @param {string} id - Represents the id on the input props
 * @param {string} eventId - The eventId to render the input for
 * @param {boolean} autoFocus - Whether to autofocus the input
 * @param {boolean} isAverage - Whether the inp
 */
export default function AttemptResultInput({
  id, eventId, autoFocus, isAverage, value, onChange,
}) {
  const event = events.byId[eventId];

  // const [value, setValue] = useState(initialValue);

  // get value() {
  //   const { eventId, isAverage } = this.props;

  //   if (event.isTimedEvent) {
  //     return this.centisecondsInput.value;
  //   } if (event.isFewestMoves) {
  //     if (isAverage) {
  //       return Math.round(parseFloat(this.movesInput.value) * 100);
  //     }
  //     return parseInt(this.movesInput.value, 10);
  //   } if (event.isMultipleBlindfolded) {
  //     return mbPointsToAttemptResult(parseInt(this.mbldPointsInput.value, 10));
  //   }
  //   throw new Error(`Unrecognized event type: ${event.id}`);
  // }

  // const handleCentisecondsChange = (value) => {
  //   setValue(value);
  //   onChange(value);
  // };

  if (event.isTimedEvent) {
    return (
      <CentisecondsInput
        id={id}
        autoFocus={autoFocus}
        centiseconds={value}
        onChange={onChange}
      />
    );
  }

  if (event.isFewestMoves) {
    const valueFormatted = isAverage ? value / 100 : value;

    return (
      <MovesInput
        id={id}
        autoFocus={autoFocus}
        moves={valueFormatted}
        isAverage={isAverage}
        onChange={onChange}
      />
    );
  }

  if (event.isMultipleBlindfolded) {
    return (
      <PointsInput
        id={id}
        autoFocus={autoFocus}
        points={value}
        onChange={onChange}
      />
    );
  }

  throw new Error(`Unrecognized event type: ${event.id}`);
}
