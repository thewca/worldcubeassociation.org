import React from 'react';

import {
  MINUTE_IN_CS,
  SECOND_IN_CS,
} from '../../lib/utils/edit-events';

export default class CentisecondsInput extends React.Component {
  get value() {
    const minutes = parseInt(this.minutesInput.value, 10) || 0;
    const seconds = parseInt(this.secondsInput.value, 10) || 0;
    const centiseconds = parseInt(this.centisecondsInput.value, 10) || 0;
    return minutes * 60 * 100 + seconds * 100 + centiseconds;
  }

  render() {
    const {
      id, autoFocus, centiseconds, onChange,
    } = this.props;

    let centisecondsMod = centiseconds;
    const minutes = Math.floor(centisecondsMod / MINUTE_IN_CS);
    centisecondsMod %= MINUTE_IN_CS;

    const seconds = Math.floor(centisecondsMod / SECOND_IN_CS);
    centisecondsMod %= SECOND_IN_CS;

    return (
      <div>
        <input
          type="number"
          id={id}
          name="minutes"
          className="form-control"
          autoFocus={autoFocus}
          value={minutes}
          min={0}
          ref={(c) => {
            this.minutesInput = c;
          }}
          onChange={onChange}
        />
        minutes

        <input
          type="number"
          name="seconds"
          className="form-control"
          value={seconds}
          min={0}
          max={59}
          ref={(c) => {
            this.secondsInput = c;
          }}
          onChange={onChange}
        />
        seconds

        <input
          type="number"
          name="centiseconds"
          className="form-control"
          value={centisecondsMod}
          min={0}
          max={99}
          ref={(c) => {
            this.centisecondsInput = c;
          }}
          onChange={onChange}
        />
        centiseconds
      </div>
    );
  }
}
