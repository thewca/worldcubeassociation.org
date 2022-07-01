import React from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import _ from 'lodash';

import rootRender from '../../lib/edit-events';

import Cutoff from './EditCutoffModal/Cutoff';
import TimeLimitComponents from './EditTimeLimitModal/TimeLimit';
import AdvancementConditionComponents from '../AdvancementCondition';
import ButtonActivatedModal from './ButtonActivatedModal';
import { removeRoundsFromSharedTimeLimits } from '../utils';

const RoundAttributeComponents = {
  timeLimit: TimeLimitComponents,
  cutoff: Cutoff,
  advancementCondition: AdvancementConditionComponents,
};

function findRounds(wcifEvents, roundIds) {
  return _.compact(_.flatMap(wcifEvents, 'rounds')).filter((wcifRound) => roundIds.includes(wcifRound.id));
}

class EditRoundAttribute extends React.Component {
  UNSAFE_componentWillMount() {
    this.reset();
  }

  UNSAFE_componentWillReceiveProps() {
    this.reset();
  }

  getWcifRound() {
    const { wcifEvent, roundNumber } = this.props;
    return wcifEvent.rounds[roundNumber - 1];
  }

  getSavedValue() {
    const { attribute } = this.props;
    return this.getWcifRound()[attribute];
  }

  hasUnsavedChanges = () => !_.isEqual(this.getSavedValue(), this.state.value);

  onChange = (value) => {
    this.setState({ value });
  };

  onOk = () => {
    const { attribute } = this.props;
    const wcifRound = this.getWcifRound();
    wcifRound[attribute] = this.state.value;

    // This is gross. timeLimit is special because of cross round cumulative time limits.
    // If you set a time limit for 3x3x3 round 1 shared with 2x2x2 round 1, then we need
    // to make sure the same timeLimit gets set for both of the rounds.
    if (attribute == 'timeLimit') {
      // the new time limit for this round
      // we just want timeLimit = this.state.value, however the ids are required in the
      // second step but modified in the first step; so make a copy of them
      const { centiseconds } = this.state.value;
      const cumulativeRoundIds = [...this.state.value.cumulativeRoundIds];
      const timeLimit = { centiseconds, cumulativeRoundIds };

      // First, remove all rounds which appear in cumulativeRoundIds from everywhere.
      // (although, this only affects those which previously shared a time limit with this round)
      removeRoundsFromSharedTimeLimits(
        this.props.wcifEvents,
        // if time limit is changed to 'per solve', cumulativeRoundIds will be empty,
        // but we still (potentially) need to remove the round from other cumulative time limits
        // which is why it (wcifRound.id) is added on the end here
        [...cumulativeRoundIds, wcifRound.id],
      );

      // Second, clobber the time limits for all rounds
      // that this round now shares a time limit with.
      if (timeLimit) {
        findRounds(this.props.wcifEvents, cumulativeRoundIds).forEach(
          (otherWcifRound) => {
            otherWcifRound.timeLimit = timeLimit;
          },
        );
      }
    }

    this._modal.close({ skipUnsavedChangesCheck: true });
    rootRender();
  };

  reset = () => {
    this.setState({ value: this.getSavedValue() });
  };

  render() {
    const {
      wcifEvents, wcifEvent, roundNumber, attribute, disabled,
    } = this.props;
    const wcifRound = this.getWcifRound();
    console.log(RoundAttributeComponents[attribute]);
    const { Show } = RoundAttributeComponents[attribute];
    const { Input } = RoundAttributeComponents[attribute];
    const { Title } = RoundAttributeComponents[attribute];

    if (!Show || !Input || !Title) {
      return null;
    }

    return (
      <ButtonActivatedModal
        buttonValue={(
          <Show
            value={this.getSavedValue()}
            wcifRound={wcifRound}
            wcifEvent={wcifEvent}
          />
        )}
        name={attribute}
        buttonClass="btn-default btn-xs"
        formClass="form-horizontal"
        onOk={this.onOk}
        reset={this.reset}
        hasUnsavedChanges={this.hasUnsavedChanges}
        ref={(c) => {
          this._modal = c;
        }}
        disabled={disabled}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <Title wcifRound={wcifRound} />
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Input
            value={this.state.value}
            wcifEvents={wcifEvents}
            wcifEvent={wcifEvent}
            roundNumber={roundNumber}
            onChange={this.onChange}
            autoFocus
          />
        </Modal.Body>
      </ButtonActivatedModal>
    );
  }
}

export function EditTimeLimitButton(props) {
  return <EditRoundAttribute {...props} attribute="timeLimit" />;
}

export function EditCutoffButton(props) {
  return <EditRoundAttribute {...props} attribute="cutoff" />;
}

export function EditAdvancementConditionButton(props) {
  return <EditRoundAttribute {...props} attribute="advancementCondition" />;
}
