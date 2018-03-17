import React from 'react'
import cn from 'classnames'
import _ from 'lodash'
import ReactDOM from 'react-dom'
import { Panel, PanelGroup, Alert } from 'react-bootstrap';

import { rootRender, promiseSaveWcif } from 'edit-schedule'
import { EditVenue } from './EditVenue'
import { SchedulesEditor } from './EditScheduleForRoom'

const currentElementsIds = {
  venue: 0,
  room: 0,
  activity: 0,
};

export function newVenueId() { return ++currentElementsIds.venue; }
export function newRoomId() { return ++currentElementsIds.room; }
export function newActivityId() { return ++currentElementsIds.activity; }

export default class EditSchedule extends React.Component {
  componentWillMount() {
    this.setState({ savedScheduleWcif: _.cloneDeep(this.props.scheduleWcif) });
    // Explore the WCIF to get the highest ids.
    this.props.scheduleWcif.venues.forEach(function(venue, index) {
      if (venue.id > currentElementsIds.venue) {
        currentElementsIds.venue = venue.id;
      }
      venue.rooms.forEach(function(room, index) {
        if (room.id > currentElementsIds.room) {
          currentElementsIds.room = room.id;
        }
        let all_ids = room.activities.map(function (elem) { return elem.id; });
        currentElementsIds.activity = Math.max(currentElementsIds.activity, Math.max(...all_ids));
      });
    });
  }

  save = e => {
    let { competitionInfo, scheduleWcif } = this.props;
    let wcif = {
      id: competitionInfo.id,
      schedule: scheduleWcif,
    };

    this.setState({ saving: true });
    console.log("This is the WCIF that would be saved:");
    console.log(wcif);
    this.setState({ savedScheduleWcif: _.cloneDeep(scheduleWcif), saving: false });
    // TODO actual save
    return;
    promiseSaveWcif(wcif).then(response => {
      return Promise.all([response, response.json()]);
    }).then(([response, json]) => {
      if(!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}\n${json["error"]}`);
      }
      this.setState({ savedScheduleWcif: _.cloneDeep(scheduleWcif), saving: false });
    }).catch(e => {
      this.setState({ saving: false });
      alert(`Something went wrong while saving.\n${e.message}`);
    });
  }


  unsavedChanges() {
    return !_.isEqual(this.state.savedScheduleWcif, this.props.scheduleWcif);
  }

  onUnload = e => {
    // Prompt the user before letting them navigate away from this page with unsaved changes.
    if(this.unsavedChanges()) {
      let confirmationMessage = "You have unsaved changes, are you sure you want to leave?";
      e.returnValue = confirmationMessage;
      return confirmationMessage;
    }
  }

  componentDidMount() {
    wca.datetimepicker();
    window.addEventListener("beforeunload", this.onUnload);
  }

  componentWillUnmount() {
    window.removeEventListener("beforeunload", this.onUnload);
  }

  render() {
    let { competitionInfo, pickerOptions, scheduleWcif, tzMapping, eventsWcif, locale } = this.props;
    let unsavedChanges = null;
    // FIXME: potentially adding this to the DOM messes with scrolling
    // with one comp/one venue/one room, selecting the room and changing a calendar setting scrolls top
    // Idea: change to a display (none/block)
    if(this.unsavedChanges()) {
      unsavedChanges = <Alert bsStyle="info">
        You have unsaved changes. Don't forget to{" "}
        <button onClick={this.save}
          disabled={this.state.saving}
          className={cn("btn", "btn-default btn-primary", { saving: this.state.saving })}
        >
          save your changes!
        </button>
      </Alert>;
    }

    let addVenueAction = e => {
      e.preventDefault();
      addVenueToSchedule(competitionInfo, scheduleWcif);
      rootRender();
    };

    let removeVenueAction = (e, index) => {
      e.preventDefault();
      if (!confirm(`Are you sure you want to remove the venue "${scheduleWcif.venues[index].name}" and all the associated rooms and schedules?`)) {
        return;
      }
      scheduleWcif.venues.splice(index, 1);
      rootRender();
    };

    let isThereAnyRoom = false;
    scheduleWcif.venues.forEach(function(venue) {
      if (venue.rooms.length > 0) {
        isThereAnyRoom = true;
        return false;
      }
    });
    let defaultActivePanel = isThereAnyRoom ? "2" : "1";

    return (
      <div>
        {unsavedChanges}
        <div className="row">
          <div className="col-xs-12">
            <DatesPicker pickerOptions={pickerOptions} scheduleWcif={scheduleWcif}/>
          </div>
          <div className="col-xs-12">
            <p>
              Depending on the size and setup of the competition, it may take place in several rooms of several venues.
              Therefore a schedule is necessarily linked to a specific room.
              Each room may have its own schedule (with all or a subset of events).
              You can create the competition's schedule below by first creating at least one venue with one room first.
              Then you will be able to select this room in the "Edit schedules" panel, and drag and drop event rounds (or attempts for some events) on it.
            </p>
            <p>
              For the typical simple competition, creating one "Main venue" with one "Main room" is enough.
              If your competition has a single venue but multiple "stages" with different schedules, please input them as different rooms.
            </p>
          </div>
          <div className="col-xs-12">
            <PanelGroup accordion id="accordion-schedule" defaultActiveKey={defaultActivePanel}>
              <Panel id="venues-edit-panel" bsStyle="primary" eventKey="1">
                <Panel.Heading>
                  <Panel.Title toggle>
                    Edit venues information <span className="collapse-indicator"></span>
                  </Panel.Title>
                </Panel.Heading>
                <Panel.Body collapsible>
                  <div className="row equal">
                    <div className="col-xs-12">
                      <p>Please add all your venues and rooms below:</p>
                    </div>
                  </div>
                  <div className="row equal">
                    {scheduleWcif.venues.map((venueWcif, index) => {
                      return (
                        <EditVenue venueWcif={venueWcif} key={index} removeVenueAction={e => removeVenueAction(e, index)} tzMapping={tzMapping} />
                      );
                    })}
                    <NewVenueElement newVenueAction={addVenueAction} />
                  </div>
                </Panel.Body>
              </Panel>
              <Panel id="schedules-edit-panel" bsStyle="primary" eventKey="2">
                <Panel.Heading>
                  <Panel.Title toggle>
                    Edit schedules <span className="collapse-indicator"></span>
                  </Panel.Title>
                </Panel.Heading>
                <Panel.Body collapsible>
                  <SchedulesEditor scheduleWcif={scheduleWcif} eventsWcif={eventsWcif} locale={locale} />
                </Panel.Body>
              </Panel>
            </PanelGroup>
          </div>
        </div>
        {unsavedChanges}
      </div>
    );
  }
}

function DatesPicker({ pickerOptions, scheduleWcif }) {
  let endDate = new Date(scheduleWcif.startDate);
  endDate.setDate(endDate.getDate() + scheduleWcif.numberOfDays - 1);
  let endDateString = `${endDate.getFullYear()}-${pad(endDate.getMonth()+1)}-${pad(endDate.getDate())}`
  return (
    <div className="row equal">
      <div className="col-xs-12">
        Dev notes: changing these dates doesn't do anything yet.
      </div>
      <div className="form-group col-md-6 col-lg-3 col-xs-12 date_picker">
        <label className="control-label date_picker" htmlFor="schedule_start_date">
          Start date for your schedule
        </label>
        <div className="input-group date datetimepicker">
          <input className="form-control date_picker" placeholder="AAAA-MM-JJ" type="text" defaultValue={scheduleWcif.startDate} data-date-options={JSON.stringify(pickerOptions)} name="startDate" id="schedule_start_date"/>
        </div>
      </div>
      <div className="form-group col-md-6 col-lg-3 col-xs-12 date_picker">
        <label className="control-label date_picker" htmlFor="schedule_end_date">
          End date for your schedule
        </label>
        <div className="input-group date datetimepicker">
          <input className="form-control date_picker" placeholder="AAAA-MM-JJ" type="text" defaultValue={endDateString} data-date-options={JSON.stringify(pickerOptions)} name="endDate" id="schedule_end_date"/>
        </div>
      </div>
    </div>
  );
}



function NewVenueElement({ newVenueAction }) {
  return (
    <div className="panel-venue">
      <a href="#" className="btn btn-success new-venue-link" onClick={newVenueAction}>Add a venue</a>
    </div>
  );
}

function pad(number) {
  if (number < 10) {
    return '0' + number;
  }
  return number;
}

function addVenueToSchedule(competitionInfo, scheduleWcif) {
  scheduleWcif.venues.push({
    id: newVenueId(),
    name: "Venue's name",
    latitudeMicrodegrees: competitionInfo.lat,
    longitudeMicrodegrees: competitionInfo.lng,
    timezone: competitionInfo.defaultTimeZoneValue,
    rooms: [],
  });
}
