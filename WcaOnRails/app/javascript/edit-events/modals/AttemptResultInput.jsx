import React from 'react'

import events from 'wca/events.js.erb'

export default class extends React.Component {
  constructor(props) {
    super(props);
  }

  onChange = () => {
    this.props.onChange();
  }

  get value() {
    return parseInt(this.centisInput.value);
  }

  render() {
    let { id, autoFocus } = this.props;
    let event = events.byId[this.props.eventId];

    if(event.timed_event) {
      return (
        <div>
          <input type="number"
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
          fewest moves? urg
        </div>
      );
    } else if(event.multiple_blindfolded) {
      return (
        <div>
          multiblind? urg
        </div>
      );
    } else {
      throw new Error(`Unrecognized event type: ${event.id}`);
    }
  }
}
