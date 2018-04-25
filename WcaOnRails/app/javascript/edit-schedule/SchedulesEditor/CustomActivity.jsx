import React from 'react'
import { Button, Modal } from 'react-bootstrap'
import {
  addActivityToCalendar,
  eventModifiedInCalendar,
  momentToIso,
} from './calendar-utils'
import { scheduleElementSelector } from './fullcalendar'

export const commonActivityCodes = {
  "other-registration": "Registration",
  "other-breakfast": "Breakfast",
  "other-lunch": "Lunch",
  "other-dinner": "Dinner",
  "other-awards": "Awards",
  "other-misc": "Other",
};

export const modeDetails = {
  create: {
    modalTitle: "Add a custom activity",
    buttonText: "Add",
    action: (hide, eventData) => {
      eventData.startTime = momentToIso(eventData.start);
      eventData.endTime = momentToIso(eventData.end);
      addActivityToCalendar(eventData);
      hide();
    },
  },
  edit: {
    modalTitle: "Edit activity",
    buttonText: "Save",
    action: (hide, eventData) => {
      // CustomActivityModal only edit name, fix the title to enable a simple update
      eventData.title = eventData.name;
      eventModifiedInCalendar(eventData);
      $(scheduleElementSelector).fullCalendar("updateEvent", eventData);
      hide();
    },
  },
};

export class CustomActivityModal extends React.Component {

  componentWillMount() {
    this.setState({
      ...this.props.eventProps
    });
  }

  componentWillReceiveProps(newProps) {
    this.setState({
      ...newProps.eventProps
    });
  }

  render () {
    let { show, handleHideModal, actionDetails, eventProps } = this.props;
    let { modalTitle, buttonText, action } = actionDetails;
    let timeText = "No time selected";
    if (eventProps.start && eventProps.end) {
      timeText = `On ${eventProps.start.format("dddd, MMMM Do YYYY")}, from ${eventProps.start.format("H:mm")} to ${eventProps.end.format("H:mm")}.`;
    }

    let handlePropChange = (propName, e) => {
      let newState = {};
      newState[propName] = e.target.value;
      if (propName == "activityCode") {
        // On change of activity code, we can update the activity name to the default
        newState.name = commonActivityCodes[newState.activityCode];
      }
      this.setState(newState);
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
              <select className="form-control" id="activity_code" value={this.state.activityCode} onChange={e => handlePropChange("activityCode", e)}>
                {Object.keys(commonActivityCodes).map(function(key) {
                  return <option key={key} value={key}>{commonActivityCodes[key]}</option>
                })}
              </select>
            </div>
          </div>
          <div className="form-group">
            <div className="control-label col-xs-3">
              <label>Name</label>
            </div>
            <div className="col-xs-8">
              <input className="form-control" type="text" id="activity_name" value={this.state.name} onChange={e => handlePropChange("name", e)}/>
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
