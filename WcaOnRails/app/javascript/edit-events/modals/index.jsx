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
        buttonClass="btn-default btn-xs"
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

export function EditTimeLimitButton(props) {
  return <EditRoundAttribute {...props} attribute="timeLimit" />;
};

export function EditCutoffButton(props) {
  return <EditRoundAttribute {...props} attribute="cutoff" />;
};

export function EditAdvancementConditionButton(props) {
  return <EditRoundAttribute {...props} attribute="advancementCondition" />;
};
