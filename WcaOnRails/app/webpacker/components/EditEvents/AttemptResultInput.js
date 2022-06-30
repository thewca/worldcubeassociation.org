import React from 'react';

import events from '../../lib/wca-data/events.js.erb';
import {
  mbPointsToAttemptResult,
  attemptResultToMbPoints,
} from '../../lib/utils/edit-events';
import CentisecondsInput from './CentisecondsInput';

// https://www.worldcubeassociation.org/regulations/#E2d1
const MAX_FMC_SOLUTION_LENGTH = 80;

export default class AttemptResultInput extends React.Component {
  onChange = () => {
    const { onChange } = this.props;
    return onChange();
  };

  get value() {
    const { eventId, isAverage } = this.props;
    const event = events.byId[eventId];

    if (event.isTimedEvent) {
      return this.centisecondsInput.value;
    } if (event.isFewestMoves) {
      if (isAverage) {
        return Math.round(parseFloat(this.movesInput.value) * 100);
      }
      return parseInt(this.movesInput.value, 10);
    } if (event.isMultipleBlindfolded) {
      return mbPointsToAttemptResult(parseInt(this.mbldPointsInput.value, 10));
    }
    throw new Error(`Unrecognized event type: ${event.id}`);
  }

  render() {
    const {
      id, eventId, autoFocus, isAverage, value,
    } = this.props;
    const event = events.byId[eventId];

    if (event.isTimedEvent) {
      return (
        <CentisecondsInput
          id={id}
          autoFocus={autoFocus}
          centiseconds={value}
          onChange={this.onChange}
          ref={(c) => {
            this.centisecondsInput = c;
          }}
        />
      );
    }

    if (event.isFewestMoves) {
      const valueFormatted = isAverage ? value / 100 : value;
      return (
        <div>
          <input
            type="number"
            min={1}
            max={MAX_FMC_SOLUTION_LENGTH}
            step={isAverage ? 0.01 : 1}
            id={id}
            className="form-control"
            autoFocus={autoFocus}
            value={valueFormatted}
            ref={(c) => {
              this.movesInput = c;
            }}
            onChange={this.onChange}
          />
          moves
        </div>
      );
    }

    if (event.isMultipleBlindfolded) {
      return (
        <div>
          <input
            type="number"
            min={1}
            id={id}
            className="form-control"
            autoFocus={autoFocus}
            value={attemptResultToMbPoints(value)}
            ref={(c) => {
              this.mbldPointsInput = c;
            }}
            onChange={this.onChange}
          />
          points
        </div>
      );
    }
    throw new Error(`Unrecognized event type: ${event.id}`);
  }
}
