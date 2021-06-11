import React from 'react'
import cn from 'classnames'
import ReactDOM from 'react-dom'
import _ from 'lodash';

import events from '../../lib/wca-data/events.js.erb'
import formats from '../../lib/wca-data/formats.js.erb'
import rootRender from '../../lib/edit-events'
import { pluralize } from '../../lib/utils/edit-events'
import { buildActivityCode, saveWcif, roundIdToString } from '../../lib/utils/wcif'
import { removeRoundsFromSharedTimeLimits } from "./EditRoundAttribute"
import { EditTimeLimitButton, EditCutoffButton, EditAdvancementConditionButton, EditQualificationButton } from './EditRoundAttribute'

export default class EditEvents extends React.Component {
  save = e => {
    let {competitionId, wcifEvents} = this.props;

    this.setState({ saving: true });
    let onSuccess = () => this.setState({ savedWcifEvents: _.cloneDeep(wcifEvents), saving: false });
    let onFailure = () => this.setState({ saving: false });

    saveWcif(competitionId, { events: wcifEvents }, onSuccess, onFailure);
  }

  unsavedChanges() {
    return !_.isEqual(this.state.savedWcifEvents, this.props.wcifEvents);
  }

  onUnload = e => {
    // Prompt the user before letting them navigate away from this page with unsaved changes.
    if(this.unsavedChanges()) {
      let confirmationMessage = "You have unsaved changes, are you sure you want to leave?";
      e.returnValue = confirmationMessage;
      return confirmationMessage;
    }
  }

  UNSAFE_componentWillMount() {
    this.setState({ savedWcifEvents: _.cloneDeep(this.props.wcifEvents) });
  }

  componentDidMount() {
    window.addEventListener("beforeunload", this.onUnload);
  }

  componentWillUnmount() {
    window.removeEventListener("beforeunload", this.onUnload);
  }

  render() {
    let { competitionId, canAddAndRemoveEvents, canUpdateEvents, wcifEvents } = this.props;
    let unsavedChanges = null;
    if(this.unsavedChanges()) {
      unsavedChanges = (
        <div className="alert alert-info">
          You have unsaved changes. Don't forget to{" "}
          <button onClick={this.save}
            disabled={this.state.saving}
            className={cn("btn", "btn-default btn-primary", { saving: this.state.saving })}
          >
            save your changes!
          </button>
        </div>
      );
    }
    return (
      <div>
        {unsavedChanges}
        <div className="row equal">
          {wcifEvents.map(wcifEvent => {
            return (
              <div key={wcifEvent.id} className="col-xs-12 col-sm-12 col-md-12 col-lg-4">
                <EventPanel wcifEvents={wcifEvents} wcifEvent={wcifEvent} canAddAndRemoveEvents={canAddAndRemoveEvents} canUpdateEvents={canUpdateEvents} />
              </div>
            );
          })}
        </div>
        {unsavedChanges}
      </div>
    );
  }
}

function RoundsTable({ wcifEvents, wcifEvent, disabled }) {
  let event = events.byId[wcifEvent.id];

  return (
    <div className="table-responsive">
      <table className="table table-condensed">
        <thead>
          <tr>
            <th>#</th>
            <th className="text-center">Format</th>
            <th className="text-center">Scramble Sets</th>
            {event.canChangeTimeLimit && <th className="text-center">Time Limit</th>}
            {event.canHaveCutoff && <th className="text-center">Cutoff</th>}
            <th className="text-center">To Advance</th>
          </tr>
        </thead>
        <tbody>
          {wcifEvent.rounds.map((wcifRound, index) => {
            let roundNumber = index + 1;
            let isLastRound = roundNumber === wcifEvent.rounds.length;

            let roundFormatChanged = e => {
              let newFormat = e.target.value;
              if (wcifRound.cutoff && !formats.byId[newFormat].allowedFirstPhaseFormats.includes(wcifRound.cutoff.numberOfAttempts.toString())) {
                if (confirm(`Are you sure you want to change the format of ${roundIdToString(wcifRound.id)}? This will clear the cutoff.`)) {
                  wcifRound.format = newFormat;
                  wcifRound.cutoff = null;
                }
              } else {
                wcifRound.format = newFormat;
              }
              rootRender();
            };

            let scrambleSetCountChanged = e => {
              let newScrambleSetCount = parseInt(e.target.value);
              wcifRound.scrambleSetCount = newScrambleSetCount;
              rootRender();
            };

            return (
              <tr key={roundNumber} className={`round-${roundNumber}`}>
                <td>{roundNumber}</td>
                <td>
                  <select name="format" className="form-control input-xs" value={wcifRound.format} onChange={roundFormatChanged} disabled={disabled}>
                    {event.formats().map(format => <option key={format.id} value={format.id}>{format.shortName}</option>)}
                  </select>
                </td>

                <td className="text-center">
                  <input name="scrambleSetCount" className="form-control input-xs" type="number" min={1} value={wcifRound.scrambleSetCount} onChange={scrambleSetCountChanged} disabled={disabled} />
                </td>

                {event.canChangeTimeLimit && (
                  <td className="text-center">
                    <EditTimeLimitButton wcifEvents={wcifEvents} wcifEvent={wcifEvent} roundNumber={roundNumber} disabled={disabled} />
                  </td>
                )}

                {event.canHaveCutoff && (
                  <td className="text-center">
                    <EditCutoffButton wcifEvents={wcifEvents} wcifEvent={wcifEvent} roundNumber={roundNumber} disabled={disabled} />
                  </td>
                )}

                <td className="text-center">
                  {!isLastRound && <EditAdvancementConditionButton wcifEvents={wcifEvents} wcifEvent={wcifEvent} roundNumber={roundNumber} disabled={disabled} />}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <h5>
        Qualification: <EditQualificationButton wcifEvent={wcifEvent} disabled={disabled} />
      </h5>
    </div>
  );
}

function EventPanel({ wcifEvents, canAddAndRemoveEvents, canUpdateEvents, wcifEvent }) {
  let event = events.byId[wcifEvent.id];

  let removeEvent = () => {
    if(!wcifEvent.rounds
       || (wcifEvent.rounds.length > 0 && !confirm(`Are you sure you want to remove all ${pluralize(wcifEvent.rounds.length, "round")} of ${event.name}?`))) {
      return;
    }

    // before removing all rounds of the event, remove those rounds from any
    // shared cumulative time limits
    removeRoundsFromSharedTimeLimits(wcifEvents, wcifEvent.rounds.map(round => round.id));

    // remove the rounds themselves
    wcifEvent.rounds = null;
    rootRender();
  };

  let setRoundCount = newRoundCount => {
    wcifEvent.rounds = wcifEvent.rounds || [];
    let roundsToRemoveCount = wcifEvent.rounds.length - newRoundCount;
    if(roundsToRemoveCount > 0) {
      if(!confirm(`Are you sure you want to remove ${pluralize(roundsToRemoveCount, "round")} of ${event.name}?`)) {
        return;
      }
      // We have too many rounds

      // Rounds to remove may have been part of shared cumulative time limits,
      // so remove these rounds from those groupings
      removeRoundsFromSharedTimeLimits(
        wcifEvents,
        wcifEvent.rounds.filter((_, index) => index >= newRoundCount).map(round => round.id)
      );

      // Remove the extra rounds themselves
      // Note: do this after dealing with cumulative time limits above
      wcifEvent.rounds = _.take(wcifEvent.rounds, newRoundCount);

      // Final rounds must not have an advance to next round requirement.
      if(wcifEvent.rounds.length >= 1) {
        _.last(wcifEvent.rounds).advancementCondition = null;
      }
    } else {
      // We do not have enough rounds, create the missing ones.
      while(wcifEvent.rounds.length < newRoundCount) {
        addRoundToEvent(wcifEvent);
      }
    }
    rootRender();
  };

  let roundsCountSelector = null;
  let disabled = !canUpdateEvents;
  if(wcifEvent.rounds) {
    let disableRemove = !canAddAndRemoveEvents;
    roundsCountSelector = (
      <div className="input-group">
        <select
          className="form-control input-xs"
          name="selectRoundCount"
          value={wcifEvent.rounds.length}
          onChange={e => setRoundCount(parseInt(e.target.value))}
          disabled={disabled}
        >
          <option value={0}># of rounds?</option>
          <option disabled="disabled">────────</option>
          <option value={1}>1 round</option>
          <option value={2}>2 rounds</option>
          <option value={3}>3 rounds</option>
          <option value={4}>4 rounds</option>
        </select>

        <span className="input-group-btn">
          <button
            className="btn btn-danger btn-xs remove-event"
            disabled={disableRemove}
            title={disableRemove ? `Cannot remove ${event.name} because the competition is confirmed.` : ""}
            onClick={removeEvent}
          >
            Remove event
          </button>
        </span>
      </div>
    );
  } else {
    let disableAdd = !canAddAndRemoveEvents;
    roundsCountSelector = (
      <button
        className="btn btn-success btn-xs add-event"
        disabled={disableAdd}
        title={disableAdd ? `Cannot add ${event.name} because the competition is confirmed.` : ""}
        onClick={() => setRoundCount(0)}
      >
        Add event
      </button>
    );
  }

  return (
    <div className={`panel panel-default event-${wcifEvent.id}`}>
      <div className="panel-heading">
        <h3 className="panel-title">
          <span className={cn("img-thumbnail", "cubing-icon", `event-${event.id}`)}></span>
          <span className="title">{event.name}</span>
          {" "}{roundsCountSelector}
        </h3>
      </div>

      {wcifEvent.rounds && (
        <div className="panel-body">
          <RoundsTable wcifEvents={wcifEvents} wcifEvent={wcifEvent} disabled={disabled} />
        </div>
      )}
    </div>
  );
}

function addRoundToEvent(wcifEvent) {
  const DEFAULT_TIME_LIMIT = { centiseconds: 10*60*100, cumulativeRoundIds: [] };
  let event = events.byId[wcifEvent.id];
  let nextRoundNumber = wcifEvent.rounds.length + 1;
  wcifEvent.rounds.push({
    id: buildActivityCode({ eventId: wcifEvent.id, roundNumber: nextRoundNumber }),
    format: event.recommendedFormat().id,
    timeLimit: DEFAULT_TIME_LIMIT,
    cutoff: null,
    advancementCondition: null,
    results: [],
    groups: [],
    scrambleSetCount: 1,
  });
}
