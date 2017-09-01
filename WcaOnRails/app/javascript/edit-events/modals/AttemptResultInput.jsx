import React from 'react'

import events from 'wca/events.js.erb'
import { mbPointsToAttemptResult, attemptResultToMbPoints } from './utils'

export default class extends React.Component {
  onChange = () => {
    this.props.onChange();
  }

  get value() {
    let event = events.byId[this.props.eventId];

    if(event.timed_event) {
      return parseInt(this.centisInput.value);
    } else if(event.fewest_moves) {
      return parseInt(this.movesInput.value);
    } else if(event.multiple_blindfolded) {
      return mbPointsToAttemptResult(parseInt(this.mbldPointsInput.value));
    } else {
      throw new Error(`Unrecognized event type: ${event.id}`);
    }
  }

  render() {
    let { id, autoFocus } = this.props;
    let event = events.byId[this.props.eventId];

    if(event.timed_event) {
      return (
        <div>
          <input type="text"
                 id={id}
                 className="form-control"
                 autoFocus={autoFocus}
                 value={this.props.value}
                 ref={c => this.centisInput = c}
                 onChange={this.onChange} />
          (centiseconds)
        </div>
      );
    } else if(event.fewest_moves) {
      return (
        <div>
          <input type="number"
                 id={id}
                 className="form-control"
                 autoFocus={autoFocus}
                 value={this.props.value}
                 ref={c => this.movesInput = c}
                 onChange={this.onChange} />
          (moves)
        </div>
      );
    } else if(event.multiple_blindfolded) {
      return (
        <div>
          <input type="number"
                 id={id}
                 className="form-control"
                 autoFocus={autoFocus}
                 value={attemptResultToMbPoints(this.props.value)}
                 ref={c => this.mbldPointsInput = c}
                 onChange={this.onChange} />
          (mbld points)
        </div>
      );
    } else {
      throw new Error(`Unrecognized event type: ${event.id}`);
    }
  }
}
