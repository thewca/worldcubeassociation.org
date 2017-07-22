import React from 'react'
import ReactDOM from 'react-dom'
import Modal from 'react-bootstrap/lib/Modal'
import Radio from 'react-bootstrap/lib/Radio'
import Button from 'react-bootstrap/lib/Button'
import Checkbox from 'react-bootstrap/lib/Checkbox'
import FormGroup from 'react-bootstrap/lib/FormGroup'

import events from 'wca/events.js.erb'
import formats from 'wca/formats.js.erb'
import { rootRender } from 'edit-events'

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
        <Modal show={this.state.showModal} onHide={this.close}>
          <form onSubmit={e => { e.preventDefault(); this.props.onSave(); }}>
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
      <FormGroup ref={c => this.formGroup = c}>
        {this.props.children.map(child => {
          return React.cloneElement(child, {
            name: this.props.name,
            key: child.props.value,
            checked: this.props.value == child.props.value,
            onChange: this.props.onChange,
          });
        })}
      </FormGroup>
    );
  }
}

class EditRoundAttribute extends React.Component {
  componentWillMount() {
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
    this.getWcifRound()[this.props.attribute] = this.state.value;
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
        buttonValue={<Show value={this.getSavedValue()} />}
        onSave={this.onSave}
        reset={this.reset}
        ref={c => this._modal = c}
      >
        <Modal.Header closeButton>
          <Modal.Title><Title wcifEvent={wcifEvent} roundNumber={roundNumber} /></Modal.Title>
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
    Title({ wcifEvent, roundNumber }) {
      let event = events.byId[wcifEvent.id];
      return <span>Time limit for {event.name}, Round {roundNumber}</span>;
    },
    Show({ value: timeLimit }) {
      let timeStr = `${(timeLimit.centiseconds / 100 / 60).toFixed(2)} minutes`;
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
      wcifEvents.forEach(wcifEvent => {
        otherWcifRounds = otherWcifRounds.concat(wcifEvent.rounds.filter(r => r != wcifRound));
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
      return (
        <span>
          centis
          <input type="number"
                 autoFocus={autoFocus}
                 ref={c => centisInput = c}
                 value={timeLimit.centiseconds}
                 onChange={onChangeAggregator} />

          <RadioGroup value={timeLimit.cumulativeRoundIds.length == 0 ? "per-solve" : "cumulative"}
                      name="cumulative-radio"
                      onChange={onChangeAggregator}
                      ref={c => cumulativeRadio = c}
          >
            <Radio value="per-solve" inline>Per Solve</Radio>
            <Radio value="cumulative" inline>Cumulative</Radio>
          </RadioGroup>

          {timeLimit.cumulativeRoundIds.length >= 1 && (
            <span>
              {otherWcifRounds.map(wcifRound => {
                let roundId = wcifRound.id;
                return (
                  <label key={roundId}>
                    <input type="checkbox"
                           value={roundId}
                           checked={timeLimit.cumulativeRoundIds.indexOf(roundId) >= 0}
                           ref={c => roundCheckboxes.push(c) }
                           onChange={onChangeAggregator} />
                    {roundId}
                  </label>
                );
              })}
            </span>
          )}
        </span>
      );
    },
  },
  cutoff: {
    Title({ wcifEvent, roundNumber }) {
      let event = events.byId[wcifEvent.id];
      return <span>Cutoff for {event.name}, Round {roundNumber}</span>;
    },
    Show({ value: cutoff }) {
      let str;
      if(cutoff) {
        str = `better than or equal to ${cutoff.attemptResult} in ${cutoff.numberOfAttempts}`;
      } else {
        str = "-";
      }
      return <span>{str}</span>;
    },
    Input({ value: cutoff, onChange, autoFocus }) {
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
        <span>
          <select value={cutoff ? cutoff.numberOfAttempts : 0}
                  autoFocus={autoFocus}
                  onChange={onChangeAggregator}
                  ref={c => numberOfAttemptsInput = c}
          >
            <option value={0}>No cutoff</option>
            <option disabled="disabled">────────</option>
            <option value={1}>1 attempt</option>
            <option value={2}>2 attempts</option>
            <option value={3}>3 attempts</option>
          </select>
          {cutoff && (
            <span>
              {" "}to get better than or equal to{" "}
              <input type="number"
                     value={cutoff.attemptResult}
                     onChange={onChangeAggregator}
                     ref={c => attemptResultInput = c}
              />
            </span>
          )}
        </span>
      );
    },
  },
  advancementCondition: {
    Title({ wcifEvent, roundNumber }) {
      let event = events.byId[wcifEvent.id];
      return <span>Requirement to advance from {event.name} round {roundNumber} to round {roundNumber + 1}</span>;
    },
    Show({ value: advancementCondition }) {
      function advanceReqToStr(advancementCondition) {
        return advancementCondition ? `${advancementCondition.type} ${advancementCondition.level}` : "-";
      }
      let str = advanceReqToStr(advancementCondition);
      return <span>{str}</span>;
    },
    Input({ value: advancementCondition, onChange, autoFocus }) {
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
              level: attemptResultInput ? parseInt(attemptResult.value) : 0,
            };
            break;
          default:
            newAdvancementCondition = null;
            break;
        }
        onChange(newAdvancementCondition);
      };

      return (
        <span>
          <select value={advancementCondition ? advancementCondition.type : ""}
                  autoFocus={autoFocus}
                  onChange={onChangeAggregator}
                  ref={c => typeInput = c}
          >
            <option value="">TBA</option>
            <option disabled="disabled">────────</option>
            <option value="ranking">Ranking</option>
            <option value="percent">Percent</option>
            <option value="attemptResult">Result</option>
          </select>

          {advancementCondition && advancementCondition.type == "ranking" && (
            <span>
              <input type="number" value={advancementCondition.level} onChange={onChangeAggregator} ref={c => rankingInput = c} />
              ranking?
            </span>
          )}

          {advancementCondition && advancementCondition.type == "percent" && (
            <span>
              <input type="number" value={advancementCondition.level} onChange={onChangeAggregator} ref={c => percentInput = c} />
              percent?
            </span>
          )}

          {advancementCondition && advancementCondition.type == "attemptResult" && (
            <span>
              <input type="number" value={advancementCondition.level} onChange={onChangeAggregator} ref={c => attemptResultInput = c} />
              my shirt?
            </span>
          )}
        </span>
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
