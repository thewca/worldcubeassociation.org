import React from 'react';
import cn from 'classnames';
import _ from 'lodash';
import {
  Alert,
  Col,
  Panel,
  PanelGroup,
  Row,
  Clearfix,
} from 'react-bootstrap';

import rootRender from '.';
import { saveWcif } from '../wca/wcif-utils';
import EditVenue from './EditVenue';
import SchedulesEditor from './SchedulesEditor';
import { initElementsIds, newVenueId } from './utils';

/* eslint react/prop-types: "off" */
/* eslint jsx-a11y/anchor-is-valid: "off" */
/* eslint no-restricted-globals: "off" */
/* eslint import/no-cycle: "off" */
/* eslint no-alert: "off" */

function addVenueToSchedule(competitionInfo) {
  competitionInfo.scheduleWcif.venues.push({
    id: newVenueId(),
    name: competitionInfo.venue,
    countryIso2: competitionInfo.countryIso2,
    latitudeMicrodegrees: competitionInfo.lat,
    longitudeMicrodegrees: competitionInfo.lng,
    timezone: '',
    rooms: [],
  });
}

export default class EditSchedule extends React.Component {
  constructor(props) {
    super(props);
    this.onUnload = this.onUnload.bind(this);
    this.unsavedChanges = this.unsavedChanges.bind(this);
  }

  /* eslint camelcase: ["error", {allow: ["UNSAFE_componentWillMount"]}] */
  UNSAFE_componentWillMount() {
    const { competitionInfo } = this.props;
    this.setState({ savedScheduleWcif: _.cloneDeep(competitionInfo.scheduleWcif) });
    initElementsIds(competitionInfo.scheduleWcif.venues);
  }

  componentDidMount() {
    window.wca.datetimepicker();
    window.addEventListener('beforeunload', this.onUnload);
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.onUnload);
  }

  onUnload(e) {
    // Prompt the user before letting them navigate away from this page with unsaved changes.
    if (this.unsavedChanges()) {
      const confirmationMessage = 'You have unsaved changes, are you sure you want to leave?';
      e.returnValue = confirmationMessage;
      return confirmationMessage;
    }
    return false;
  }

  unsavedChanges() {
    const { savedScheduleWcif } = this.state;
    const { competitionInfo } = this.props;
    return !_.isEqual(savedScheduleWcif, competitionInfo.scheduleWcif);
  }

  render() {
    const { competitionInfo, locale, setupCalendarHandlers } = this.props;
    const { scheduleWcif } = competitionInfo;
    const { saving } = this.state;

    const save = () => {
      this.setState({ saving: true });
      const onSuccess = () => this.setState({
        savedScheduleWcif: _.cloneDeep(competitionInfo.scheduleWcif),
        saving: false,
      });
      const onFailure = () => this.setState({ saving: false });

      saveWcif(competitionInfo.id, {
        schedule: competitionInfo.scheduleWcif,
      }, onSuccess, onFailure);
    };

    const actionsHandlers = {
      addVenue: (e) => {
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

    const isThereAnyRoom = scheduleWcif.venues.some((venue) => venue.rooms.length > 0);

    const unsavedChanges = this.unsavedChanges() ? (
      <UnsavedChangesAlert
        actionHandler={save}
        saving={saving}
      />
    ) : null;

    return (
      <div>
        {unsavedChanges}
        <Row>
          <IntroductionMessage />
          <Col xs={12}>
            <PanelGroup accordion id="accordion-schedule" defaultActiveKey={isThereAnyRoom ? '2' : '1'}>
              <Panel id="venues-edit-panel" bsStyle="info" eventKey="1">
                <div id="accordion-schedule-heading-1" className="panel-heading heading-as-link" aria-controls="accordion-schedule-body-1" role="button" data-toggle="collapse" data-target="#accordion-schedule-body-1" data-parent="#accordion-schedule">
                  <Panel.Title>
                    Edit venues information
                    {' '}
                    <span className="collapse-indicator" />
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
                    Edit schedules
                    {' '}
                    <span className="collapse-indicator" />
                  </Panel.Title>
                </div>
                <Panel.Body id="schedules-edit-panel-body" collapsible>
                  <SchedulesEditor
                    scheduleWcif={scheduleWcif}
                    eventsWcif={competitionInfo.eventsWcif}
                    locale={locale}
                    setupCalendarHandlers={setupCalendarHandlers}
                  />
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

const UnsavedChangesAlert = ({ actionHandler, saving }) => (
  <Alert bsStyle="info">
    You have unsaved changes. Don&rsquo;t forget to
    {' '}
    <button
      type="button"
      onClick={actionHandler}
      disabled={saving}
      className={cn('btn', 'btn-default btn-primary', { saving })}
    >
      save your changes!
    </button>
  </Alert>
);

const IntroductionMessage = () => (
  <Col xs={12}>
    <p>
      Depending on the size and setup of the competition, it may take place in
      several rooms of several venues.
      Therefore a schedule is necessarily linked to a specific room.
      Each room may have its own schedule (with all or a subset of events).
      So you can start creating the competition&rsquo;s schedule below by adding at
      least one venue with one room.
      Then you will be able to select this room in the &quot;Edit schedules&quot;
      panel, and drag and drop event rounds (or attempts for some events) on it.
    </p>
    <p>
      For the typical simple competition, creating one &quot;Main venue&quot;
      with one &quot;Main room&quot; is enough.
      If your competition has a single venue but multiple &quot;stages&quot; with different
      schedules, please input them as different rooms.
    </p>
  </Col>
);

const VenuesList = ({ venues, actionsHandlers, competitionInfo }) => (
  <Row>
    {venues.map((venueWcif, index) => (
      <React.Fragment key={venueWcif.id}>
        <Col xs={12} md={6}>
          <EditVenue
            venueWcif={venueWcif}
            removeVenueAction={(e) => actionsHandlers.removeVenue(e, index)}
            competitionInfo={competitionInfo}
          />
        </Col>
        {/*
          Every venue col doesn't have the same height, so we need a clearfix
          depending on our index and viewport.
          In XS there is one venue per row, so no clearfix needed.
          In MD there are two venues per row, so if we're last, we need a clearfix.
        */}
        {index % 2 === 1 && <Clearfix visibleMdBlock />}
      </React.Fragment>
    ))}
    <Col xs={12} md={6}>
      <NewVenue actionHandler={actionsHandlers.addVenue} />
    </Col>
  </Row>
);

const NewVenue = ({ actionHandler }) => (
  <div className="panel-venue">
    <a href="#" className="btn btn-success new-venue-link" onClick={actionHandler}>Add a venue</a>
  </div>
);
