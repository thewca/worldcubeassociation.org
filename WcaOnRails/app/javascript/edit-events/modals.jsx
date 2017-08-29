import React from 'react'
import ReactDOM from 'react-dom'
import Modal from 'react-bootstrap/lib/Modal'
import Radio from 'react-bootstrap/lib/Radio'
import Button from 'react-bootstrap/lib/Button'
import Checkbox from 'react-bootstrap/lib/Checkbox'

import events from 'wca/events.js.erb'
import formats from 'wca/formats.js.erb'
import { rootRender } from 'edit-events'

function roundIdToString(roundId) {
  let [ eventId, roundNumber ] = roundId.split("-");
  roundNumber = parseInt(roundNumber);
  let event = events.byId[eventId];
  return `${event.name}, Round ${roundNumber}`;
}

function centisecondsToString(centiseconds) {
  const seconds = centiseconds / 100;
  const minutes = seconds / 60;
  const hours = minutes / 60;

  // TODO <<< >>>
  if(hours >= 1) {
    return `${hours.toFixed(2)} hours`;
  } else if(minutes >= 1) {
    return `${minutes.toFixed(2)} minutes`;
  } else {
    return `${seconds.toFixed(2)} seconds`;
  }
}

function attemptResultToString(attemptResult, eventId) {
  let event = events.byId[eventId];
  if(event.timed_event) {
    return centisecondsToString(attemptResult);
  } else if(event.fewest_moves) {
    return `${attemptResult} moves`;
  } else if(event.multiple_blindfolded) {
    return `${attemptResult} points`; // TODO <<<>>>
  } else {
    throw new Error(`Unrecognized event type: ${eventId}`);
  }
}

class ButtonActivatedModal extends React.Component {
  constructor() {
    super();
    this.state = { showModal: false };
  }

  open = () => {
    this.setState({ showModal: true });
  }

  close = () => {
    this.props.reset();
    this.setState({ showModal: false });
  }

  render() {
    return (
      <button type="button" className="btn btn-default btn-xs"
              onClick={this.open}>
        {this.props.buttonValue}
        <Modal show={this.state.showModal} onHide={this.close} backdrop="static">
          <form className={this.props.formClass} onSubmit={e => { e.preventDefault(); this.props.onSave(); }}>
            {this.props.children}
            <Modal.Footer>
              <Button onClick={this.close} className="pull-left">Close</Button>
              <Button onClick={this.props.reset} bsStyle="danger" className="pull-left">Reset</Button>
              <Button type="submit" bsStyle="primary">Save</Button>
            </Modal.Footer>
          </form>
        </Modal>
      </button>
    );
  }
}

class RadioGroup extends React.Component {
  get value() {
    let formGroupDom = ReactDOM.findDOMNode(this.formGroup);
    return formGroupDom.querySelectorAll('input:checked')[0].value
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

function findRoundsSharingTimeLimitWithRound(wcifEvents, wcifRound) {
  let roundsSharingTimeLimit = [];
  wcifEvents.forEach(otherWcifEvent => {
    otherWcifEvent.rounds.forEach(otherWcifRound => {
      if(otherWcifRound == wcifRound || !otherWcifRound.timeLimit) {
        return;
      }

      if(otherWcifRound.timeLimit.cumulativeRoundIds.indexOf(wcifRound.id) >= 0) {
        roundsSharingTimeLimit.push(otherWcifRound);
      }
    });
  });
  return roundsSharingTimeLimit;
}

function findRounds(wcifEvents, roundIds) {
  let wcifRounds = [];
  wcifEvents.forEach(wcifEvent => {
    wcifEvent.rounds.forEach(wcifRound => {
      if(roundIds.indexOf(wcifRound.id) >= 0) {
        wcifRounds.push(wcifRound);
      }
    });
  });
  return wcifRounds;
}

class EditRoundAttribute extends React.Component {
  componentWillMount() {
    this.reset();
  }

  componentWillReceiveProps() {
    this.reset();
  }

  getWcifRound() {
    let { wcifEvent, roundNumber } = this.props;
    return wcifEvent.rounds[roundNumber - 1];
  }

  getSavedValue() {
    return this.getWcifRound()[this.props.attribute];
  }

  onChange = (value) => {
    this.setState({ value: value });
  }

  onSave = () => {
    let wcifRound = this.getWcifRound();
    wcifRound[this.props.attribute] = this.state.value;

    // This is gross. timeLimit is special because of cross round cumulative time limits.
    // If you set a time limit for 3x3x3 round 1 shared with 2x2x2 round 1, then we need
    // to make sure the same timeLimit gets set for both of the rounds.
    if(this.props.attribute == "timeLimit") {
      let timeLimit = this.state.value;

      // First, remove this round from all other rounds that previously shared
      // a time limit with this round.
      findRoundsSharingTimeLimitWithRound(this.props.wcifEvents, wcifRound).forEach(otherWcifRound => {
        let index = otherWcifRound.timeLimit.cumulativeRoundIds.indexOf(wcifRound.id);
        if(index < 0) {
          throw new Error();
        }
        otherWcifRound.timeLimit.cumulativeRoundIds.splice(index, 1);
      });

      // Second, clobber the time limits for all rounds that this round now shares a time limit with.
      if(timeLimit) {
        findRounds(this.props.wcifEvents, timeLimit.cumulativeRoundIds).forEach(wcifRound => {
          wcifRound.timeLimit = timeLimit;
        });
      }
    }

    this._modal.close();
    rootRender();
  }

  reset = () => {
    this.setState({ value: this.getSavedValue() });
  }

  render() {
    let { wcifEvents, wcifEvent, roundNumber } = this.props;
    let wcifRound = this.getWcifRound();
    let Show = RoundAttributeComponents[this.props.attribute].Show;
    let Input = RoundAttributeComponents[this.props.attribute].Input;
    let Title = RoundAttributeComponents[this.props.attribute].Title;

    return (
      <ButtonActivatedModal
        buttonValue={<Show value={this.getSavedValue()} wcifEvent={wcifEvent} />}
        formClass="form-horizontal"
        onSave={this.onSave}
        reset={this.reset}
        ref={c => this._modal = c}
      >
        <Modal.Header closeButton>
          <Modal.Title><Title wcifRound={wcifRound} /></Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Input value={this.state.value} wcifEvents={wcifEvents} wcifEvent={wcifEvent} roundNumber={roundNumber} onChange={this.onChange} autoFocus />
        </Modal.Body>
      </ButtonActivatedModal>
    );
  }
}

let RoundAttributeComponents = {
  timeLimit: {
    Title({ wcifRound }) {
      return <span>Time limit for {roundIdToString(wcifRound.id)}</span>;
    },
    Show({ value: timeLimit }) {
      let timeStr = centisecondsToString(timeLimit.centiseconds);
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
          of their solves in this round. This is called a cumulative time limit, defined in
          regulation <a href="https://www.worldcubeassociation.org/regulations/#A1a2" target="_blank">A1a2</a>.
        </span>);
      } else {
        let otherSelectedRoundIds = timeLimit.cumulativeRoundIds.filter(roundId => roundId != wcifRound.id);
        description = (<span>
          This round has a cross round cumulative time limit (see
          guideline <a href="https://www.worldcubeassociation.org/regulations/guidelines.html#A1a2++" target="_blank">A1a2++</a>).
          This means that competitors have {centisecondsToString(timeLimit.centiseconds)} total for all
          of their solves in this round ({wcifRound.id})
          {" "}<strong>shared with</strong>:
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
              <input type="number"
                     id="time-limit-input"
                     className="form-control"
                     autoFocus={autoFocus}
                     ref={c => centisInput = c}
                     value={timeLimit.centiseconds}
                     onChange={onChangeAggregator} />
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
                    let disabledReason = disabled && `Cannot select this round because you've already selected a round with event ${event.name}`;
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
  },
  cutoff: {
    Title({ wcifRound }) {
      return <span>Cutoff for {roundIdToString(wcifRound.id)}</span>;
    },
    Show({ value: cutoff, wcifEvent }) {
      let str;
      if(cutoff) {
        str = `better than or equal to ${attemptResultToString(cutoff.attemptResult, wcifEvent.id)} in ${cutoff.numberOfAttempts}`;
      } else {
        str = "-";
      }
      return <span>{str}</span>;
    },
    Input({ value: cutoff, onChange, autoFocus, wcifEvent, roundNumber }) {
      let wcifRound = wcifEvent.rounds[roundNumber - 1];

      let numberOfAttemptsInput, attemptResultInput;
      let onChangeAggregator = () => {
        let numberOfAttempts = parseInt(numberOfAttemptsInput.value);
        let newCutoff;
        if(numberOfAttempts > 0) {
          newCutoff = {
            numberOfAttempts,
            attemptResult: attemptResultInput ? parseInt(attemptResultInput.value) : 0,
          };
        } else {
          newCutoff = null;
        }
        onChange(newCutoff);
      };

      return (
        <div>
          <div className="form-group">
            <label htmlFor="cutoff-round-format-input" className="col-sm-3 control-label">Round format</label>
            <div className="col-sm-9">
              <div className="input-group">
                <select value={cutoff ? cutoff.numberOfAttempts : 0}
                        autoFocus={autoFocus}
                        onChange={onChangeAggregator}
                        className="form-control"
                        id="cutoff-round-format-input"
                        ref={c => numberOfAttemptsInput = c}
                >
                  <option value={0}>No cutoff</option>
                  <option disabled="disabled">────────</option>
                  <option value={1}>Best of 1</option>
                  <option value={2}>Best of 2</option>
                  <option value={3}>Best of 3</option>
                </select>
                <div className="input-group-addon">
                  <strong>/ {formats.byId[wcifRound.format].name}</strong>
                </div>
              </div>
            </div>
          </div>
          {cutoff && (
            <div className="form-group">
              <label htmlFor="cutoff-input" className="col-sm-3 control-label">Cutoff</label>
              <div className="col-sm-9">
                <input type="number"
                       className="form-control"
                       id="cutoff-input"
                       value={cutoff.attemptResult}
                       onChange={onChangeAggregator}
                       ref={c => attemptResultInput = c}
                />
              </div>
            </div>
          )}
        </div>
      );
    },
  },
  advancementCondition: {
    Title({ wcifRound }) {
      return <span>Requirement to advance past {roundIdToString(wcifRound.id)}</span>;
    },
    Show({ value: advancementCondition }) {
      function advanceReqToStr(advancementCondition) {
        // TODO <<< >>>
        return advancementCondition ? `${advancementCondition.type} ${advancementCondition.level}` : "-";
      }
      let str = advanceReqToStr(advancementCondition);
      return <span>{str}</span>;
    },
    Input({ value: advancementCondition, onChange, autoFocus, roundNumber, wcifEvent }) {
      let typeInput, rankingInput, percentInput, attemptResultInput;
      let onChangeAggregator = () => {
        let type = typeInput.value;
        let newAdvancementCondition;
        switch(typeInput.value) {
          case "ranking":
            newAdvancementCondition = {
              type: "ranking",
              level: rankingInput ? parseInt(rankingInput.value): 0,
            };
            break;
          case "percent":
            newAdvancementCondition = {
              type: "percent",
              level: percentInput ? parseInt(percentInput.value) : 0,
            };
            break;
          case "attemptResult":
            newAdvancementCondition = {
              type: "attemptResult",
              level: attemptResultInput ? parseInt(attemptResultInput.value) : 0,
            };
            break;
          default:
            newAdvancementCondition = null;
            break;
        }
        onChange(newAdvancementCondition);
      };

      let advancementInput = null;
      let helpBlock = null;
      let advancementType = advancementCondition ? advancementCondition.type : "";
      switch(advancementType) {
        case "ranking":
          advancementInput = <input type="number" className="form-control" value={advancementCondition.level} onChange={onChangeAggregator} ref={c => rankingInput = c} />;
          helpBlock = `The top ${advancementCondition.level} competitors from round ${roundNumber} will advance to round ${roundNumber + 1}.`;
          break;
        case "percent":
          advancementInput = <input type="number" className="form-control" value={advancementCondition.level} onChange={onChangeAggregator} ref={c => percentInput = c} />;
          helpBlock = `The top ${advancementCondition.level}% of competitors from round ${roundNumber} will advance to round ${roundNumber + 1}.`;
          break;
        case "attemptResult":
          advancementInput = <input type="number" className="form-control" value={advancementCondition.level} onChange={onChangeAggregator} ref={c => attemptResultInput = c} />;
          helpBlock = `Everyone in round ${roundNumber} with a result better than or equal to ${attemptResultToString(advancementCondition.level, wcifEvent.id)} will advance to round ${roundNumber + 1}.`;
          break;
        default:
          advancementInput = null;
          break;
      }

      return (
        <div>
          <div className="form-group">
            <div className="col-sm-12">
              <div className="input-group advancement-condition">
                <select value={advancementCondition ? advancementCondition.type : ""}
                        autoFocus={autoFocus}
                        onChange={onChangeAggregator}
                        className="form-control"
                        ref={c => typeInput = c}
                >
                  <option value="">To be announced</option>
                  <option disabled="disabled">────────</option>
                  <option value="ranking">Ranking</option>
                  <option value="percent">Percent</option>
                  <option value="attemptResult">Result</option>
                </select>

                {advancementInput}
              </div>
            </div>
          </div>
          {helpBlock}
        </div>
      );
    },
  },
};

export function EditTimeLimitButton(props) {
  return <EditRoundAttribute {...props} attribute="timeLimit" />;
};

export function EditCutoffButton(props) {
  return <EditRoundAttribute {...props} attribute="cutoff" />;
};

export function EditAdvancementConditionButton(props) {
  return <EditRoundAttribute {...props} attribute="advancementCondition" />;
};
