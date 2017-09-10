import React from 'react'
import cn from 'classnames'
import ReactDOM from 'react-dom'

import events from 'wca/events.js.erb'
import { rootRender, promiseSaveWcif } from 'edit-events'
import { EditTimeLimitButton, EditCutoffButton, EditAdvancementConditionButton } from 'edit-events/modals'

export default class EditEvents extends React.Component {
  save = e => {
    let {competitionId, wcifEvents} = this.props;
    let wcif = {
      id: competitionId,
      events: wcifEvents,
    };

    this.setState({ saving: true });
    promiseSaveWcif(wcif).then(response => {
      return Promise.all([response, response.json()]);
    }).then(([response, json]) => {
      if(!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}\n${json["error"]}`);
      }
      this.setState({ savedWcifEvents: _.cloneDeep(wcifEvents), saving: false });
    }).catch(e => {
      this.setState({ saving: false });
      alert(`Something went wrong while saving.\n${e.message}`);
    });
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

  componentWillMount() {
    this.setState({ savedWcifEvents: _.cloneDeep(this.props.wcifEvents) });
  }

  componentDidMount() {
    window.addEventListener("beforeunload", this.onUnload);
  }

  componentWillUnmount() {
    window.removeEventListener("beforeunload", this.onUnload);
  }

  render() {
    let { competitionId, competitionConfirmed, wcifEvents } = this.props;
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
              <div key={wcifEvent.id} className="col-xs-12 col-sm-12 col-md-6 col-lg-4">
                <EventPanel wcifEvents={wcifEvents} wcifEvent={wcifEvent} competitionConfirmed={competitionConfirmed} />
              </div>
            );
          })}
        </div>
        {unsavedChanges}
      </div>
    );
  }
}

function RoundsTable({ wcifEvents, wcifEvent }) {
  let event = events.byId[wcifEvent.id];
  return (
    <div className="table-responsive">
      <table className="table table-condensed">
        <thead>
          <tr>
            <th>#</th>
            <th className="text-center">Format</th>
            {event.canChangeTimeLimit && <th className="text-center">Time Limit</th>}
            <th className="text-center">Cutoff</th>
            <th className="text-center">To Advance</th>
          </tr>
        </thead>
        <tbody>
          {wcifEvent.rounds.map((wcifRound, index) => {
            let roundNumber = index + 1;
            let isLastRound = roundNumber === wcifEvent.rounds.length;

            let roundFormatChanged = e => {
              let newFormat = e.target.value;
              wcifRound.format = newFormat;
              rootRender();
            };

            let abbreviate = str => {
              return str.split(" ").map(word => word[0]).join("");
            };

            return (
              <tr key={roundNumber} className={`round-${roundNumber}`}>
                <td>{roundNumber}</td>
                <td>
                  <select name="format" className="form-control input-xs" value={wcifRound.format} onChange={roundFormatChanged}>
                    {event.formats().map(format => <option key={format.id} value={format.id}>{abbreviate(format.name)}</option>)}
                  </select>
                </td>

                {event.canChangeTimeLimit && (
                  <td className="text-center">
                    <EditTimeLimitButton wcifEvents={wcifEvents} wcifEvent={wcifEvent} roundNumber={roundNumber} />
                  </td>
                )}

                <td className="text-center">
                  <EditCutoffButton wcifEvents={wcifEvents} wcifEvent={wcifEvent} roundNumber={roundNumber} />
                </td>

                <td className="text-center">
                  {!isLastRound && <EditAdvancementConditionButton wcifEvents={wcifEvents} wcifEvent={wcifEvent} roundNumber={roundNumber} />}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EventPanel({ wcifEvents, competitionConfirmed, wcifEvent }) {
  let event = events.byId[wcifEvent.id];
  let roundCountChanged = e => {
    let newRoundCount = parseInt(e.target.value);
    if(wcifEvent.rounds.length > newRoundCount) {
      // We have too many rounds, remove the extras.
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

  let panelTitle = null;
  let disableAdd = false;
  let disableRemove = false;
  if(competitionConfirmed) {
    if(wcifEvent.rounds.length === 0) {
      disableAdd = true;
      panelTitle = `Cannot add ${wcifEvent.id} because the competition is confirmed.`;
    } else {
      disableRemove = true;
      panelTitle = `Cannot remove ${wcifEvent.id} because the competition is confirmed.`;
    }
  }

  return (
    <div className={cn(`panel panel-default event-${wcifEvent.id}`, { 'event-not-being-held': wcifEvent.rounds.length == 0 })}>
      <div className="panel-heading" title={panelTitle}>
        <h3 className="panel-title">
          <span className={cn("img-thumbnail", "cubing-icon", `event-${event.id}`)}></span>
          <span className="title">{event.name}</span>
          {" "}
          <select
            className="form-control input-xs"
            name="select-round-count"
            value={wcifEvent.rounds.length}
            onChange={roundCountChanged}
            disabled={disableAdd}
          >
            {!disableRemove && <option value={0}>Not being held</option>}
            {!disableRemove && <option disabled="disabled">────────</option>}
            <option value={1}>1 round</option>
            <option value={2}>2 rounds</option>
            <option value={3}>3 rounds</option>
            <option value={4}>4 rounds</option>
          </select>
        </h3>
      </div>

      {wcifEvent.rounds.length > 0 && (
        <div className="panel-body">
          <RoundsTable wcifEvents={wcifEvents} wcifEvent={wcifEvent} />
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
    id: `${wcifEvent.id}-${nextRoundNumber}`,
    format: event.recommentedFormat().id,
    timeLimit: DEFAULT_TIME_LIMIT,
    cutoff: null,
    advancementCondition: null,
    results: [],
    groups: [],
  });
}
