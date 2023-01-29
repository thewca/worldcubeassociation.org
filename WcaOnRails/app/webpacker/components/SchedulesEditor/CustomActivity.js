import React from 'react';
import { Button, Modal } from 'react-bootstrap';
import _ from 'lodash';
import {
  addActivityToCalendar,
  eventModifiedInCalendar,
  fcEventToActivity,
} from '../../lib/utils/calendar';
import { scheduleElementSelector } from '../../lib/helpers/edit-schedule';

export const commonActivityCodes = {
  'other-registration': 'On-site registration',
  'other-checkin': 'Check-in',
  'other-tutorial': 'Tutorial for new competitors',
  'other-breakfast': 'Breakfast',
  'other-lunch': 'Lunch',
  'other-dinner': 'Dinner',
  'other-awards': 'Awards',
  'other-misc': 'Other',
};

export const modeDetails = {
  create: {
    modalTitle: 'Add a custom activity',
    buttonText: 'Add',
    action: (hide, eventData) => {
      // 'eventData' may contain the id from a previous activity
      const newEventData = _.pick(eventData, ['title', 'activityCode', 'start', 'end']);
      addActivityToCalendar(fcEventToActivity(newEventData));
      hide();
    },
  },
  edit: {
    modalTitle: 'Edit activity',
    buttonText: 'Save',
    action: (hide, eventData) => {
      eventModifiedInCalendar(eventData);
      $(scheduleElementSelector).fullCalendar('updateEvent', eventData);
      hide();
    },
  },
};

/* eslint react/prop-types: "off" */
/* eslint jsx-a11y/label-has-associated-control: "off" */

export class CustomActivityModal extends React.Component {
  /* eslint camelcase: ["error", {
    allow: ["UNSAFE_componentWillMount", "UNSAFE_componentWillReceiveProps"],
  }] */
  UNSAFE_componentWillMount() {
    const { eventProps } = this.props;
    this.setState({
      ...eventProps,
    });
  }

  UNSAFE_componentWillReceiveProps(newProps) {
    const { eventProps } = newProps;
    this.setState({
      ...eventProps,
    });
  }

  render() {
    const {
      show, handleHideModal, actionDetails, eventProps,
    } = this.props;
    const { modalTitle, buttonText, action } = actionDetails;
    const { title, activityCode } = this.state;
    let timeText = 'No time selected';
    if (eventProps.start && eventProps.end) {
      timeText = `On ${eventProps.start.format('dddd, MMMM Do YYYY')}, from ${eventProps.start.format('H:mm')} to ${eventProps.end.format('H:mm')}.`;
    }

    const handleNameChange = (event) => {
      this.setState({ title: event.target.value });
    };

    const handleActivityCodeChange = (event) => {
      this.setState({
        activityCode: event.target.value,
        // On change of activity code, we can update the activity name to the default
        // NOTE: we use "title" as the property for the activity name, as fullcalendar uses "title"
        title: commonActivityCodes[event.target.value],
      });
    };

    return (
      <Modal show={show} onHide={handleHideModal} container={this}>
        <Modal.Header closeButton>
          <Modal.Title>{modalTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="form-horizontal row">
          <div className="form-group">
            <div className="control-label col-xs-3">
              <label>Type of activity</label>
            </div>
            <div className="col-xs-8">
              <select
                className="form-control"
                id="activity_code"
                value={activityCode}
                onChange={handleActivityCodeChange}
              >
                {Object.keys(commonActivityCodes).map((key) => (
                  <option key={key} value={key}>{commonActivityCodes[key]}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <div className="control-label col-xs-3">
              <label>Name</label>
            </div>
            <div className="col-xs-8">
              <input
                className="form-control"
                type="text"
                id="activity_name"
                value={title}
                onChange={handleNameChange}
              />
            </div>
          </div>
          <div className="form-group">
            <div className="col-xs-10 col-xs-offset-2">
              {timeText}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => action(handleHideModal, this.state)} bsStyle="success">{buttonText}</Button>
          <Button onClick={handleHideModal}>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}
