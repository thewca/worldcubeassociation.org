import React from 'react'
import cn from 'classnames'
import _ from 'lodash'
import { Panel, PanelGroup, Alert, Row, Col } from 'react-bootstrap';

import { rootRender, promiseSaveWcif } from 'edit-schedule'
import { EditVenue } from './EditVenue'
import { SchedulesEditor } from './SchedulesEditor'
import { initElementsIds, newVenueId } from './utils'

export const schedulesEditPanelSelector = "#schedules-edit-panel";

export default class EditSchedule extends React.Component {
  componentWillMount() {
    this.setState({ savedScheduleWcif: _.cloneDeep(this.props.competitionInfo.scheduleWcif) });
    initElementsIds(this.props.competitionInfo.scheduleWcif.venues);
  }

  save = e => {
    let { competitionInfo } = this.props;
    let wcif = {
      id: competitionInfo.id,
      schedule: competitionInfo.scheduleWcif,
    };

    this.setState({ saving: true });
    promiseSaveWcif(wcif).then(response => {
      return Promise.all([response, response.json()]);
    }).then(([response, json]) => {
      if(!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}\n${json["error"]}`);
      }
      this.setState({ savedScheduleWcif: _.cloneDeep(competitionInfo.scheduleWcif), saving: false });
    }).catch(e => {
      this.setState({ saving: false });
      alert(`Something went wrong while saving.\n${e.message}`);
    });
  }


  unsavedChanges() {
    return !_.isEqual(this.state.savedScheduleWcif, this.props.competitionInfo.scheduleWcif);
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
    let { competitionInfo, locale } = this.props;
    let scheduleWcif = competitionInfo.scheduleWcif;

    let actionsHandlers = {
      addVenue: e => {
        e.preventDefault();
        addVenueToSchedule(competitionInfo);
        rootRender();
      },
      removeVenue: (e, index) => {
        e.preventDefault();
        if (!confirm(`Are you sure you want to remove the venue "${scheduleWcif.venues[index].name}" and all the associated rooms and schedules?`)) {
          return;
        }
        scheduleWcif.venues.splice(index, 1);
        rootRender();
      },
    };

    let isThereAnyRoom = scheduleWcif.venues.some(function (element) {
      return element.rooms.length > 0;
    });

    let defaultActivePanel = isThereAnyRoom ? "2" : "1";

    let unsavedChanges = null;
    if (this.unsavedChanges()) {
      unsavedChanges = <UnsavedChangesAlert
                           unsavedChanges={this.unsavedChanges()}
                           actionHandler={this.save}
                           saving={this.state.saving}
                       />
    }

    return (
      <div>
        {unsavedChanges}
        <Row>
          <IntroductionMessage />
          <Col xs={12}>
            <PanelGroup accordion id="accordion-schedule" defaultActiveKey={defaultActivePanel}>
              <Panel id="venues-edit-panel" bsStyle="info" eventKey="1">
                <div id="accordion-schedule-heading-1" className="panel-heading heading-as-link" aria-controls="accordion-schedule-body-1" role="button" data-toggle="collapse" data-target="#accordion-schedule-body-1" data-parent="#accordion-schedule">
                  <Panel.Title>
                    Edit venues information <span className="collapse-indicator"></span>
                  </Panel.Title>
                </div>
                <Panel.Body collapsible>
                  <Row>
                    <Col xs={12}>
                      <p>Please add all your venues and rooms below:</p>
                    </Col>
                  </Row>
                  <VenuesList
                    venues={scheduleWcif.venues}
                    actionsHandlers={actionsHandlers}
                    competitionInfo={competitionInfo}
                  />
                </Panel.Body>
              </Panel>
              <Panel id="schedules-edit-panel" bsStyle="info" eventKey="2">
                <div id="accordion-schedule-heading-2" className="panel-heading heading-as-link" aria-controls="accordion-schedule-body-2" role="button" data-toggle="collapse" data-target="#accordion-schedule-body-2" data-parent="#accordion-schedule">
                  <Panel.Title>
                    Edit schedules <span className="collapse-indicator"></span>
                  </Panel.Title>
                </div>
                <Panel.Body id="schedules-edit-panel-body" collapsible>
                  <SchedulesEditor scheduleWcif={scheduleWcif} eventsWcif={competitionInfo.eventsWcif} locale={locale} />
                </Panel.Body>
              </Panel>
            </PanelGroup>
          </Col>
        </Row>
        {unsavedChanges}
      </div>
    );
  }
}

const UnsavedChangesAlert = ({ actionHandler, saving }) => {
  return (
    <Alert bsStyle="info">
      You have unsaved changes. Don't forget to{" "}
      <button onClick={actionHandler}
        disabled={saving}
        className={cn("btn", "btn-default btn-primary", { saving: saving })}
      >
        save your changes!
      </button>
    </Alert>
  );
}

const IntroductionMessage = () => {
  return (
    <Col xs={12}>
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
    </Col>
  );
}

const VenuesList = ({venues, actionsHandlers, competitionInfo}) => {
  return (
    <Row>
      {venues.map((venueWcif, index) => {
        return (
          <EditVenue
            venueWcif={venueWcif}
            key={index}
            index={index}
            removeVenueAction={e => actionsHandlers.removeVenue(e, index)}
            competitionInfo={competitionInfo}
          />
        );
      })}
      <NewVenue actionHandler={actionsHandlers.addVenue} />
    </Row>
  );
}

const NewVenue = ({ actionHandler }) => {
  return (
    <div className="panel-venue">
      <a href="#" className="btn btn-success new-venue-link" onClick={actionHandler}>Add a venue</a>
    </div>
  );
}

function addVenueToSchedule(competitionInfo) {
  competitionInfo.scheduleWcif.venues.push({
    id: newVenueId(),
    name: competitionInfo.venue,
    latitudeMicrodegrees: competitionInfo.lat,
    longitudeMicrodegrees: competitionInfo.lng,
    // There is at least one for all countries, select the first
    timezone: competitionInfo.countryZones[Object.keys(competitionInfo.countryZones)[0]],
    rooms: [],
  });
}
