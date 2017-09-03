import React from 'react'
import cn from 'classnames'
import ReactDOM from 'react-dom'

import events from 'wca/events.js.erb'
import { rootRender, promiseSaveWcif } from 'edit-events'
import { EditTimeLimitButton, EditCutoffButton, EditAdvancementConditionButton } from 'edit-events/modals'

export default class EditEvents extends React.Component {
  constructor(props) {
    super(props);
    this.save = this.save.bind(this);
    this.onUnload = this.onUnload.bind(this);
  }

  save(e) {
    let {competitionId, wcifEvents} = this.props;
    let wcif = {
      id: competitionId,
      events: wcifEvents,
    };

    this.setState({ saving: true });
    promiseSaveWcif(wcif).then(response => {
      if(!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response;
    }).then(() => {
      this.setState({ savedWcifEvents: clone(this.props.wcifEvents), saving: false });
    }).catch(() => {
      this.setState({ saving: false });
      alert("Something went wrong while saving.");
    });
  }

  unsavedChanges() {
    return !deepEqual(this.state.savedWcifEvents, this.props.wcifEvents);
  }

  onUnload(e) {
    if(this.unsavedChanges()) {
      var confirmationMessage = "\o/";
      e.returnValue = confirmationMessage;
      return confirmationMessage;
    }
  }

  componentWillMount() {
    this.setState({ savedWcifEvents: clone(this.props.wcifEvents) });
  }

  componentDidMount() {
    window.addEventListener("beforeunload", this.onUnload);
  }

  componentWillUnmount() {
    window.removeEventListener("beforeunload", this.onUnload);
  }

  render() {
    let { competitionId, wcifEvents } = this.props;
    return (
      <div>
        <div className="row equal">
          {wcifEvents.map(wcifEvent => {
            return (
              <div key={wcifEvent.id} className="col-xs-12 col-sm-12 col-md-6 col-lg-4">
                <EventPanel wcifEvents={wcifEvents} wcifEvent={wcifEvent} />
              </div>
            );
          })}
        </div>
        <button onClick={this.save}
                disabled={this.state.saving}
                className={cn("btn", "btn-default", { "btn-primary": this.unsavedChanges(), saving: this.state.saving })}
        >
          Update Competition
        </button>
      </div>
    );
  }
}

function RoundsTable({ wcifEvents, wcifEvent }) {
  let event = events.byId[wcifEvent.id];
  let canChangeTimeLimit = event.can_change_time_limit;
  return (
    <div className="table-responsive">
      <table className="table table-condensed">
        <thead>
          <tr>
            <th>#</th>
            <th className="text-center">Format</th>
            {canChangeTimeLimit && <th className="text-center">Time Limit</th>}
            <th className="text-center">Cutoff</th>
            <th className="text-center">To Advance</th>
          </tr>
        </thead>
        <tbody>
          {wcifEvent.rounds.map((wcifRound, index) => {
            let roundNumber = index + 1;
            let isLastRound = roundNumber == wcifEvent.rounds.length;

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

                {canChangeTimeLimit && (
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

const EventPanel = ({ wcifEvents, wcifEvent }) => {
  let event = events.byId[wcifEvent.id];
  let roundCountChanged = e => {
    let newRoundCount = parseInt(e.target.value);
    if(wcifEvent.rounds.length > newRoundCount) {
      // We have too many rounds, remove the extras.
      wcifEvent.rounds = wcifEvent.rounds.slice(0, newRoundCount);

      // Final rounds must not have an advance to next round requirement.
      if(wcifEvent.rounds.length >= 1) {
        let lastRound = wcifEvent.rounds[wcifEvent.rounds.length - 1];
        lastRound.advancementCondition = null;
      }
    } else {
      // We do not have enough rounds, create the missing ones.
      while(wcifEvent.rounds.length < newRoundCount) {
        addRoundToEvent(wcifEvent);
      }
    }
    rootRender();
  };

  return (
    <div className={cn(`panel panel-default event-${wcifEvent.id}`, { 'event-not-being-held': wcifEvent.rounds.length == 0 })}>
      <div className="panel-heading">
        <h3 className="panel-title">
          <span className={cn("img-thumbnail", "cubing-icon", `event-${event.id}`)}></span>
          <span className="title">{event.name}</span>
          {" "}
          <select className="form-control input-xs" name="select-round-count" value={wcifEvent.rounds.length} onChange={roundCountChanged}>
            <option value={0}>Not being held</option>
            <option disabled="disabled">────────</option>
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
};

function addRoundToEvent(wcifEvent) {
  const DEFAULT_TIME_LIMIT = { centiseconds: 10*60*100, cumulativeRoundIds: [] };
  let event = events.byId[wcifEvent.id];
  let nextRoundNumber = wcifEvent.rounds.length + 1;
  wcifEvent.rounds.push({
    id: `${wcifEvent.id}-${nextRoundNumber}`,
    format: event.recommended_format().id,
    timeLimit: DEFAULT_TIME_LIMIT,
    cutoff: null,
    advancementCondition: null,
    results: [],
    groups: [],
  });
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function deepEqual(obj1, obj2) {
  return JSON.stringify(obj1) == JSON.stringify(obj2);
}
