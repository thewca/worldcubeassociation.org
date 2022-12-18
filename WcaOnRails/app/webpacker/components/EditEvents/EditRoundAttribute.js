import React from 'react'
import cn from 'classnames'
import Modal from 'react-bootstrap/lib/Modal'
import Button from 'react-bootstrap/lib/Button'
import Checkbox from 'react-bootstrap/lib/Checkbox'
import _ from 'lodash';

import { events, formats } from '../../lib/wca-data.js.erb'
import rootRender from '../../lib/edit-events'

import CutoffComponents from './Cutoff'
import TimeLimitComponents from './TimeLimit'
import AdvancementConditionComponents from './AdvancementCondition'
import ButtonActivatedModal from './ButtonActivatedModal'
import QualificationComponents from './Qualification'

let RoundAttributeComponents = {
  timeLimit: TimeLimitComponents,
  cutoff: CutoffComponents,
  advancementCondition: AdvancementConditionComponents,
};

let EventAttributeComponents = {
  qualification: QualificationComponents,
};

/**
 * Finds the cumulativeRoundIds of each event in wcifEvents and removes any
 * which are found in wcifRounds. Note that it modifies wicfEvents in place.
 *
 * @param {collection} wcifEvents Will be modified in place.
 * @param {Array}      wcifRounds Rounds to be removed from all cumulativeRoundIds.
 */
export function removeRoundsFromSharedTimeLimits(wcifEvents, wcifRounds) {
  _.compact(_.flatMap(wcifEvents, 'rounds')).forEach(otherWcifRound => {
    // fmc and mbf don't have timelimits
    if (otherWcifRound.timeLimit) {
      _.pull(otherWcifRound.timeLimit.cumulativeRoundIds, ...wcifRounds)
    }
  });
}

function findRounds(wcifEvents, roundIds) {
  return _.compact(_.flatMap(wcifEvents, 'rounds')).filter(wcifRound => roundIds.includes(wcifRound.id));
}

class EditRoundAttribute extends React.Component {
  UNSAFE_componentWillMount() {
    this.reset();
  }

  UNSAFE_componentWillReceiveProps() {
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
      // the new time limit for this round
      // we just want timeLimit = this.state.value, however the ids are required in the
      // second step but modified in the first step; so make a copy of them
      const centiseconds = this.state.value.centiseconds;
      const cumulativeRoundIds = [...this.state.value.cumulativeRoundIds];
      const timeLimit = { centiseconds, cumulativeRoundIds };

      // First, remove all rounds which appear in cumulativeRoundIds from everywhere.
      // (although, this only affects those which previously shared a time limit with this round)
      removeRoundsFromSharedTimeLimits(
        this.props.wcifEvents,
        // if time limit is changed to 'per solve', cumulativeRoundIds will be empty,
        // but we still (potentially) need to remove the round from other cumulative time limits
        // which is why it (wcifRound.id) is added on the end here
        [...cumulativeRoundIds, wcifRound.id]
      );

      // Second, clobber the time limits for all rounds that this round now shares a time limit with.
      if(timeLimit) {
        findRounds(this.props.wcifEvents, cumulativeRoundIds).forEach(otherWcifRound => {
          otherWcifRound.timeLimit = timeLimit;
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
    let { wcifEvents, wcifEvent, roundNumber, attribute, disabled } = this.props;
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
        disabled={disabled}
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

class EditEventAttribute extends React.Component {
  UNSAFE_componentWillMount() {
    this.reset();
  }

  UNSAFE_componentWillReceiveProps() {
    this.reset();
  }

  getSavedValue() {
    let { wcifEvent, attribute } = this.props;
    return wcifEvent[attribute];
  }

  hasUnsavedChanges = () => {
    return !_.isEqual(this.getSavedValue(), this.state.value);
  }

  onChange = (value) => {
    this.setState({ value });
  }

  onOk = () => {
    let { wcifEvent, attribute } = this.props;
    wcifEvent[attribute] = this.state.value;

    this._modal.close({ skipUnsavedChangesCheck: true });
    rootRender();
  }

  reset = () => {
    this.setState({ value: this.getSavedValue() });
  }

  render() {
    let { wcifEvent, attribute, disabled } = this.props;
    let Show = EventAttributeComponents[attribute].Show;
    let Input = EventAttributeComponents[attribute].Input;
    let Title = EventAttributeComponents[attribute].Title;

    return (
      <ButtonActivatedModal
        buttonValue={<Show value={this.getSavedValue()} wcifEvent={wcifEvent} />}
        name={attribute}
        buttonClass="btn-default btn-xs"
        formClass="form-horizontal"
        onOk={this.onOk}
        reset={this.reset}
        hasUnsavedChanges={this.hasUnsavedChanges}
        ref={c => this._modal = c}
        disabled={disabled}
      >
        <Modal.Header closeButton>
          <Modal.Title><Title wcifEvent={wcifEvent} /></Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Input value={this.state.value} wcifEvent={wcifEvent} onChange={this.onChange} autoFocus />
        </Modal.Body>
      </ButtonActivatedModal>
    );
  }
}

export function EditQualificationButton(props) {
  return <EditEventAttribute {...props} attribute="qualification" />;
};
