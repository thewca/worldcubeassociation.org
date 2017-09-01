import React from 'react'
import ReactDOM from 'react-dom'
import Radio from 'react-bootstrap/lib/Radio'

import events from 'wca/events.js.erb'
import formats from 'wca/formats.js.erb'
import AttemptResultInput from './AttemptResultInput'
import { centisecondsToString, roundIdToString } from './utils'

class RadioGroup extends React.Component {
  get value() {
    let formGroupDom = ReactDOM.findDOMNode(this.formGroup);
    return formGroupDom.querySelector('input:checked').value;
  }

  render() {
    return (
      <div ref={c => this.formGroup = c}>
        {this.props.children.map(child => {
          return React.cloneElement(child, {
            name: this.props.name,
            key: child.props.value,
            checked: this.props.value == child.props.value,
            onChange: this.props.onChange,
          });
        })}
      </div>
    );
  }
}

export default {
  Title({ wcifRound }) {
    return <span>Time limit for {roundIdToString(wcifRound.id)}</span>;
  },
  Show({ value: timeLimit }) {
    let timeStr = centisecondsToString(timeLimit.centiseconds, { short: true });
    let str;
    switch(timeLimit.cumulativeRoundIds.length) {
      case 0:
        str = timeStr;
        break;
      case 1:
        str = timeStr + " cumulative";
        break;
      default:
        str = timeStr + ` total for ${timeLimit.cumulativeRoundIds.join(", ")}`;
        break;
    }
    return <span>{str}</span>;
  },
  Input: function({ value: timeLimit, autoFocus, wcifEvents, wcifEvent, roundNumber, onChange }) {
    let event = events.byId[wcifEvent.id];
    let wcifRound = wcifEvent.rounds[roundNumber - 1];
    let format = formats.byId[wcifRound.format];

    let otherWcifRounds = [];
    wcifEvents.forEach(otherWcifEvent => {
      // Cross round cumulative time limits may not include other rounds of
      // the same event.
      // See https://github.com/thewca/wca-regulations/issues/457.
      let otherEvent = events.byId[otherWcifEvent.id];
      let canChangeTimeLimit = otherEvent.can_change_time_limit;
      if(!canChangeTimeLimit || wcifEvent == otherWcifEvent) {
        return;
      }
      otherWcifRounds = otherWcifRounds.concat(otherWcifEvent.rounds.filter(r => r != wcifRound));
    });

    let centisInput, cumulativeInput, cumulativeRadio;
    let roundCheckboxes = [];
    let onChangeAggregator = () => {
      let cumulativeRoundIds;
      switch(cumulativeRadio.value) {
        case "per-solve":
          cumulativeRoundIds = [];
          break;
        case "cumulative":
          cumulativeRoundIds = [wcifRound.id];
          cumulativeRoundIds = cumulativeRoundIds.concat(roundCheckboxes.filter(checkbox => checkbox.checked).map(checkbox => checkbox.value));
          break;
        default:
          throw new Error(`Unrecognized value ${cumulativeRadio.value}`);
          break;
      }

      let newTimeLimit = {
        centiseconds: parseInt(centisInput.value),
        cumulativeRoundIds,
      };
      onChange(newTimeLimit);
    };

    let description = null;
    if(timeLimit.cumulativeRoundIds.length === 0) {
      description = `Competitors have ${centisecondsToString(timeLimit.centiseconds)} for each of their solves.`;
    } else if(timeLimit.cumulativeRoundIds.length === 1) {
      description = (<span>
        Competitors have {centisecondsToString(timeLimit.centiseconds)} total for all
        of their solves in this round. This is called a cumulative time limit (see
        regulation <a href="https://www.worldcubeassociation.org/regulations/#A1a2" target="_blank">A1a2</a>).
      </span>);
    } else {
      let otherSelectedRoundIds = timeLimit.cumulativeRoundIds.filter(roundId => roundId != wcifRound.id);
      description = (<span>
        This round has a cross round cumulative time limit (see
        guideline <a href="https://www.worldcubeassociation.org/regulations/guidelines.html#A1a2++" target="_blank">A1a2++</a>).
        This means that competitors have {centisecondsToString(timeLimit.centiseconds)} total for all
        of their solves in this round ({wcifRound.id}) shared with:
        <ul>
          {otherSelectedRoundIds.map(roundId => <li key={roundId}>{roundIdToString(roundId)}</li>)}
        </ul>
      </span>);
    }

    return (
      <div>
        <div className="form-group">
          <label htmlFor="time-limit-input" className="col-sm-2 control-label">Time</label>
          <div className="col-sm-10">
            <AttemptResultInput eventId={event.id}
                                id="time-limit-input"
                                ref={c => centisInput = c}
                                autoFocus={autoFocus}
                                value={timeLimit.centiseconds}
                                onChange={onChangeAggregator}
            />
          </div>
        </div>

        <div className="form-group">
          <div className="col-sm-offset-2 col-sm-10">
            <RadioGroup value={timeLimit.cumulativeRoundIds.length == 0 ? "per-solve" : "cumulative"}
                        name="cumulative-radio"
                        onChange={onChangeAggregator}
                        ref={c => cumulativeRadio = c}
            >
              <Radio value="per-solve" inline>Per Solve</Radio>
              <Radio value="cumulative" inline>Cumulative</Radio>
            </RadioGroup>
          </div>
        </div>

        {timeLimit.cumulativeRoundIds.length >= 1 && (
          <div className="row">
            <div className="col-sm-offset-2 col-sm-10">
              <ul className="list-unstyled">
                {otherWcifRounds.map(wcifRound => {
                  let roundId = wcifRound.id;
                  let eventId = roundId.split("-")[0];
                  let event = events.byId[eventId];
                  let checked = timeLimit.cumulativeRoundIds.indexOf(roundId) >= 0;
                  let eventAlreadySelected = timeLimit.cumulativeRoundIds.find(roundId => roundId.split("-")[0] == eventId);
                  let disabled = !checked && eventAlreadySelected;
                  let disabledReason = disabled && `Cannot select this round because you've already selected a round with ${event.name}`;
                  return (
                    <li key={roundId}>
                      <div className="checkbox">
                        <label title={disabledReason}>
                          <input type="checkbox"
                                 value={roundId}
                                 checked={checked}
                                 disabled={disabled}
                                 ref={c => roundCheckboxes.push(c) }
                                 onChange={onChangeAggregator} />
                          {roundIdToString(roundId)}
                        </label>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}

        <div className="row">
          <span className="col-sm-offset-2 col-sm-10">{description}</span>
        </div>
      </div>
    );
  },
};
