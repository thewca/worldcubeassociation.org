import _ from 'lodash'
import React from 'react'
import ReactDOM from 'react-dom'
import Modal from 'react-bootstrap/lib/Modal'
import Radio from 'react-bootstrap/lib/Radio'

import { events, formats } from '../../lib/wca-data.js.erb'
import AttemptResultInput from './AttemptResultInput'
import { centisecondsToString } from '../../lib/utils/edit-events'
import { roundIdToString, parseActivityCode } from '../../lib/utils/wcif'
import ButtonActivatedModal from './ButtonActivatedModal'

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

function objectifyArray(arr) {
  return _.fromPairs(arr.map(el => [el, true]));
}

class SelectRoundsButton extends React.Component {
  state = { selectedRoundsById: objectifyArray(this.props.selectedRoundIds) };

  reset = () => {
    this.setState({ selectedRoundsById: objectifyArray(this.props.selectedRoundIds) });
  }

  getSelectedRoundIds() {
    return _.keys(_.pickBy(this.state.selectedRoundsById));
  }

  onOk = () => {
    this.props.onChange();
    this._modal.close({ skipUnsavedChangesCheck: true });
  }

  hasUnsavedChanges = () => {
    return !_.isEqual(this.props.selectedRoundIds, this.getSelectedRoundIds());
  }

  render() {
    let { timeLimit, excludeEventId, wcifEvents } = this.props;
    let selectedRoundsById = this.state.selectedRoundsById;

    let wcifRounds = _.compact(_.flatMap(wcifEvents, otherWcifEvent => {
      // Cross round cumulative time limits may not include other rounds of
      // the same event.
      // See https://github.com/thewca/wca-regulations/issues/457.
      let otherEvent = events.byId[otherWcifEvent.id];
      if(!otherEvent.canChangeTimeLimit || excludeEventId === otherWcifEvent.id) {
        return [];
      }
      return otherWcifEvent.rounds;
    }));

    return (
      <ButtonActivatedModal
        buttonValue="Share with other rounds"
        buttonClass="btn-success"
        onOk={this.onOk}
        hasUnsavedChanges={this.hasUnsavedChanges}
        reset={this.reset}
        ref={c => this._modal = c}
      >
        <Modal.Header closeButton>
          <Modal.Title>Choose rounds for cumulative time limit</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row">
            <div className="col-sm-offset-2 col-sm-10">
              <ul className="list-unstyled">
                {wcifRounds.map(wcifRound => {
                  let roundId = wcifRound.id;
                  let { eventId } = parseActivityCode(roundId);
                  let event = events.byId[eventId];
                  let checked = !!selectedRoundsById[roundId];
                  let eventAlreadySelected = this.getSelectedRoundIds().find(roundId => parseActivityCode(roundId).eventId === eventId);
                  let disabled = !checked && eventAlreadySelected;
                  let disabledReason = disabled ? `Cannot select this round because you've already selected a round with ${event.name}` : null;
                  return (
                    <li key={roundId}>
                      <div className="checkbox">
                        <label title={disabledReason}>
                          <input type="checkbox"
                                 value={roundId}
                                 checked={checked}
                                 disabled={disabled}
                                 onChange={e => {
                                   selectedRoundsById[wcifRound.id] = e.currentTarget.checked;
                                   this.setState({ selectedRoundsById });
                                 }}
                          />
                          {roundIdToString(roundId)}
                        </label>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </Modal.Body>
      </ButtonActivatedModal>
    );
  }
}

function RegulationLink({ regulation }) {
  return (
    <span>
      regulation <a href={`https://www.worldcubeassociation.org/regulations/#${regulation}`} target="_blank">
        {regulation}
      </a>
    </span>
  );
}

function GuidelineLink({ guideline }) {
  return (
    <span>
      guideline <a href={`https://www.worldcubeassociation.org/regulations/guidelines.html#${guideline}`} target="_blank">
        {guideline}
      </a>
    </span>
  );
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

    let centisInput, cumulativeInput, cumulativeRadio, roundsSelector;
    let onChangeAggregator = () => {
      let cumulativeRoundIds;
      switch(cumulativeRadio.value) {
        case "per-solve":
          cumulativeRoundIds = [];
          break;
        case "cumulative":
          cumulativeRoundIds = roundsSelector ? roundsSelector.getSelectedRoundIds() : [wcifRound.id];
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

    let selectRoundsButton = (
        <SelectRoundsButton onChange={onChangeAggregator}
                            wcifEvents={wcifEvents}
                            excludeEventId={event.id}
                            selectedRoundIds={timeLimit.cumulativeRoundIds}
                            ref={c => roundsSelector = c}
        />
    );

    let description = null;
    if(timeLimit.cumulativeRoundIds.length === 0) {
      description = `Competitors have ${centisecondsToString(timeLimit.centiseconds)} for each of their solves.`;
    } else if(timeLimit.cumulativeRoundIds.length === 1) {
      description = (<span>
        Competitors have {centisecondsToString(timeLimit.centiseconds)} total for all
        of their solves in this round. This is called a cumulative time limit
        (see <RegulationLink regulation="A1a2" />).
        The button below allows you to share this cumulative time limit with other rounds
        (see <GuidelineLink guideline="A1a2++" />).
        <div>{selectRoundsButton}</div>
      </span>);
    } else {
      let otherSelectedRoundIds = _.without(timeLimit.cumulativeRoundIds, wcifRound.id);
      description = (<span>
        This round has a cross round cumulative time limit
        (see <GuidelineLink guideline="A1a2++" />).
        This means that competitors have {centisecondsToString(timeLimit.centiseconds)} total for all
        of their solves in this round ({roundIdToString(wcifRound.id)}) shared with:
        <ul>
          {otherSelectedRoundIds.map(roundId => <li key={roundId}>{roundIdToString(roundId)}</li>)}
        </ul>
        {selectRoundsButton}
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
            <RadioGroup value={timeLimit.cumulativeRoundIds.length === 0 ? "per-solve" : "cumulative"}
                        name="cumulative-radio"
                        onChange={onChangeAggregator}
                        ref={c => cumulativeRadio = c}
            >
              <Radio value="per-solve" inline>Per Solve</Radio>
              <Radio value="cumulative" inline>Cumulative</Radio>
            </RadioGroup>
          </div>
        </div>

        <div className="row">
          <span className="col-sm-offset-2 col-sm-10">{description}</span>
        </div>
      </div>
    );
  },
};
