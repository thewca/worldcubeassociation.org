import React from 'react'
import cn from 'classnames'
import Modal from 'react-bootstrap/lib/Modal'
import Button from 'react-bootstrap/lib/Button'
import Checkbox from 'react-bootstrap/lib/Checkbox'

import events from 'wca/events.js.erb'
import formats from 'wca/formats.js.erb'
import { rootRender } from 'edit-events'

import CutoffComponents from './Cutoff'
import TimeLimitComponents from './TimeLimit'
import AdvancementConditionComponents from './AdvancementCondition'
import ButtonActivatedModal from 'edit-events/ButtonActivatedModal'

let RoundAttributeComponents = {
  timeLimit: TimeLimitComponents,
  cutoff: CutoffComponents,
  advancementCondition: AdvancementConditionComponents,
};

function findRoundsSharingTimeLimitWithRound(wcifEvents, wcifRound) {
  return _.compact(_.flatMap(wcifEvents, 'rounds')).filter(otherWcifRound =>
    otherWcifRound !== wcifRound
    && otherWcifRound.timeLimit
    && otherWcifRound.timeLimit.cumulativeRoundIds.includes(wcifRound.id)
  );
}

function findRounds(wcifEvents, roundIds) {
  return _.compact(_.flatMap(wcifEvents, 'rounds')).filter(wcifRound => roundIds.includes(wcifRound.id));
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

  hasUnsavedChanges = () => {
    return !_.isEqual(this.getSavedValue(), this.state.value);
  }

  onChange = (value) => {
    this.setState({ value });
  }

  onOk = () => {
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
        _.pull(otherWcifRound.timeLimit.cumulativeRoundIds, wcifRound.id);
      });

      // Second, clobber the time limits for all rounds that this round now shares a time limit with.
      if(timeLimit) {
        findRounds(this.props.wcifEvents, timeLimit.cumulativeRoundIds).forEach(wcifRound => {
          wcifRound.timeLimit = timeLimit;
        });
      }
    }

    this._modal.close({ skipUnsavedChangesCheck: true });
    rootRender();
  }

  reset = () => {
    this.setState({ value: this.getSavedValue() });
  }

  render() {
    let { wcifEvents, wcifEvent, roundNumber, attribute } = this.props;
    let wcifRound = this.getWcifRound();
    let Show = RoundAttributeComponents[attribute].Show;
    let Input = RoundAttributeComponents[attribute].Input;
    let Title = RoundAttributeComponents[attribute].Title;

    return (
      <ButtonActivatedModal
        buttonValue={<Show value={this.getSavedValue()} wcifRound={wcifRound} wcifEvent={wcifEvent} />}
        name={attribute}
        buttonClass="btn-default btn-xs"
        formClass="form-horizontal"
        onOk={this.onOk}
        reset={this.reset}
        hasUnsavedChanges={this.hasUnsavedChanges}
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

export function EditTimeLimitButton(props) {
  return <EditRoundAttribute {...props} attribute="timeLimit" />;
};

export function EditCutoffButton(props) {
  return <EditRoundAttribute {...props} attribute="cutoff" />;
};

export function EditAdvancementConditionButton(props) {
  return <EditRoundAttribute {...props} attribute="advancementCondition" />;
};
