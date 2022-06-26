import React from 'react'

import events from '../../lib/wca-data/events.js.erb'
import {
  MINUTE_IN_CS,
  SECOND_IN_CS,
  mbPointsToAttemptResult,
  attemptResultToMbPoints,
} from '../../lib/utils/edit-events'

// https://www.worldcubeassociation.org/regulations/#E2d1
const MAX_FMC_SOLUTION_LENGTH = 80;

class CentisecondsInput extends React.Component {
  get value() {
    let minutes = parseInt(this.minutesInput.value) || 0;
    let seconds = parseInt(this.secondsInput.value) || 0;
    let centiseconds = parseInt(this.centisecondsInput.value) || 0;
    return minutes*60*100 + seconds*100 + centiseconds;
  }

  render() {
    let { id, autoFocus, centiseconds, onChange } = this.props;

    let minutes = Math.floor(centiseconds / MINUTE_IN_CS);
    centiseconds %= MINUTE_IN_CS;

    let seconds = Math.floor(centiseconds / SECOND_IN_CS);
    centiseconds %= SECOND_IN_CS;

    return (
      <div>
        <input type="number"
               id={id}
               name="minutes"
               className="form-control"
               autoFocus={autoFocus}
               value={minutes}
               min={0}
               ref={c => this.minutesInput = c}
               onChange={onChange} />
        minutes

        <input type="number"
               name="seconds"
               className="form-control"
               value={seconds}
               min={0} max={59}
               ref={c => this.secondsInput = c}
               onChange={onChange} />
        seconds

        <input type="number"
               name="centiseconds"
               className="form-control"
               value={centiseconds}
               min={0} max={99}
               ref={c => this.centisecondsInput = c}
               onChange={onChange} />
        centiseconds
      </div>
    );
  }
}

export default class AttemptResultInput extends React.Component {
  onChange = () => {
    this.props.onChange();
  }

  get value() {
    let event = events.byId[this.props.eventId];

    if(event.isTimedEvent) {
      return this.centisecondsInput.value;
    } else if(event.isFewestMoves) {
      if (this.props.isAverage) {
        return Math.round(parseFloat(this.movesInput.value) * 100);
      } else {
        return parseInt(this.movesInput.value);
      }
    } else if(event.isMultipleBlindfolded) {
      return mbPointsToAttemptResult(parseInt(this.mbldPointsInput.value));
    } else {
      throw new Error(`Unrecognized event type: ${event.id}`);
    }
  }

  render() {
    let { id, autoFocus, isAverage } = this.props;
    let event = events.byId[this.props.eventId];

    if(event.isTimedEvent) {
      return <CentisecondsInput id={id}
                                autoFocus={autoFocus}
                                centiseconds={this.props.value}
                                onChange={this.onChange}
                                ref={c => this.centisecondsInput = c}
      />;
    } else if(event.isFewestMoves) {
      let value = isAverage ? this.props.value / 100 : this.props.value;
      return (
        <div>
          <input type="number"
                 min={1} max={MAX_FMC_SOLUTION_LENGTH}
                 step={isAverage ? 0.01 : 1}
                 id={id}
                 className="form-control"
                 autoFocus={autoFocus}
                 value={value}
                 ref={c => this.movesInput = c}
                 onChange={this.onChange} />
          moves
        </div>
      );
    } else if(event.isMultipleBlindfolded) {
      return (
        <div>
          <input type="number"
                 min={1}
                 id={id}
                 className="form-control"
                 autoFocus={autoFocus}
                 value={attemptResultToMbPoints(this.props.value)}
                 ref={c => this.mbldPointsInput = c}
                 onChange={this.onChange} />
          points
        </div>
      );
    } else {
      throw new Error(`Unrecognized event type: ${event.id}`);
    }
  }
}
