import React from 'react'
import {
  Col,
  OverlayTrigger,
  Panel,
  Row,
  Tooltip,
} from 'react-bootstrap'
import cn from 'classnames'
import events from 'wca/events.js.erb'
import { parseActivityCode, roundIdToString } from 'wca/wcif-utils'
import formats from 'wca/formats.js.erb'
import { selectedEventInCalendar, addActivityToCalendar, eventModifiedInCalendar, removeEventFromCalendar, singleSelectEvent } from './calendar-utils'
import { scheduleElementSelector } from './fullcalendar'
import { schedulesEditPanelSelector } from '../EditSchedule'
import { keyboardHandlers, editScheduleKeyboardHandler } from './keyboard-handlers'

const activityPickerElementSelector = "#activity-picker-panel";

export class ActivityPicker extends React.Component {
  constructor(props) {
    super(props);
    keyboardHandlers.activityPicker = e => editScheduleKeyboardHandler(e, this);
  }

  trySetSelectedActivity = (direction, ignoreKeyboard = false) => {
    let { eventsWcif, keyboardEnabled } = this.props;
    if ((!keyboardEnabled && !ignoreKeyboard) || eventsWcif.length == 0) {
      return;
    }
    let { selectedX: x, selectedY: y } = this.state;
    switch (direction) {
      case "up":    y--; break;
      case "down":  y++; break;
      case "left":  x--; break;
      case "right": x++; break;
      default: throw new Error(`Unknown direction: ${direction}`);
    }
    let fixedY = _.clamp(y, 0, eventsWcif.length - 1);
    let fixedX = 0;
    // Steps to find a suitable row:
    //  - Create an array of row lengths matching the events.
    //  - Start at the current position (fixedY) in the array, and go either upwards or downwards trying to find positive number of rows.
    //  - Do not move if we didn't find any suitable row.
    //  - Get corresponding x value;
    const rowLengths = eventsWcif.map(eventWcif =>
      ["333fm", "333mbf"].includes(eventWcif.id)
        ? _.sum(eventWcif.rounds.map(round => formats.byId[round.format].expectedSolveCount))
        : eventWcif.rounds.length
      );
    const positive = x => x > 0;
    if (direction === "up") {
      fixedY = _.findLastIndex(rowLengths, positive, fixedY);
    } else if (direction === "down") {
      fixedY = _.findIndex(rowLengths, positive, fixedY);
    }
    if (fixedY < 0)
      return;
    let rowLength = rowLengths[fixedY];
    fixedX = rowLength ? _.clamp(x, 0, rowLength - 1) : 0;
    this.setState({
      selectedY: fixedY,
      selectedX: fixedX,
    });
  }

  adjustPickerDimension = () => {
    let $pickerElem = $(activityPickerElementSelector);
    let $panelElem = $(schedulesEditPanelSelector);
    let visibleAvailable = $panelElem.offset().top + $panelElem.outerHeight() - $(window).scrollTop();
    // 15 is margin bottom we want to keep
    let headerHeight = $pickerElem.find(".panel-heading").outerHeight();
    let topPos = 10 + headerHeight;
    let visibleAvailableForBody = visibleAvailable - topPos - 15;
    let $bodyElem = $pickerElem.find(".panel-body");
    $bodyElem.css("height", visibleAvailableForBody);
  }

  computeBasePickerDimension = () => {
    let $pickerElem = $(activityPickerElementSelector);
    // Dynamically fix the width
    $pickerElem.width($pickerElem.parent().width());

    // Dynamically set the max height for the picker panel body
    let $bodyElem = $pickerElem.find(".panel-body");
    // 10 is margin top we want to keep
    let headerHeight = $pickerElem.find(".panel-heading").outerHeight();
    let topPos = 10 + headerHeight;
    let maxPossibleHeight = $(window).height() - topPos - 15;
    $bodyElem.css("max-height", maxPossibleHeight);
  };


  componentWillMount() {
    this.setState({
      // event's row selected (from top to bottom)
      // init to -1, as we are going to force the select of the first down
      selectedY: -1,
      // event's round or attempt selected (from left to right)
      selectedX: 0,
    }, () => this.trySetSelectedActivity("down", true));
  }

  componentDidMount() {
    let $pickerElem = $(activityPickerElementSelector);
    let $panelElem = $(schedulesEditPanelSelector);


    // The activity picker has a specific behavior when scrolling the window:
    // it stays affixed to the top of the viewport when scrolling goes below its topmost position.
    // It also shrinks to a minimum height when reaching the bottom of the viewport.
    let computeAffixedPickerDimension = () => {
        this.computeBasePickerDimension();
        this.adjustPickerDimension();
        let $panelElemHeight = $panelElem.height();
        $panelElem.css("min-height", $panelElemHeight);
    };

    let resetPanelDimension = () => {
      $panelElem.css("min-height", 0);
    };

    $pickerElem.affix({
      offset: {
        top: function () {
          // Dynamically compute the offset trigger, as we're in a collapsible element
          return $pickerElem.parent().offset().top + 10;
        },
      },
    });
    $pickerElem.on('affix.bs.affix', computeAffixedPickerDimension);
    $pickerElem.on('affix-top.bs.affix', resetPanelDimension);
    $(window).scroll(this.adjustPickerDimension);
    $(window).resize(this.computeBasePickerDimension);
    $(window).keydown(keyboardHandlers.activityPicker);

    // Activate draggable on all activities
    $(".activity-in-picker > .schedule-activity").draggable({
      start: function(event, ui) {
        $(ui.helper).find('.tooltip').hide();
      },
      revert: false,
      helper: "clone",
      // To get out of the overflow container
      appendTo: "body",
      cursor: "copy",
      cursorAt: { top: 20, left: 10 }
    });
    $(".activity-in-picker > .schedule-activity").click(e => addActivityToCalendar($(e.target).data("event")));
  }

  componentWillUnmount() {
    $(window).off("keydown", keyboardHandlers.activityPicker);
    $(window).off("resize", this.computeBasePickerDimension);
    $(window).off("scroll", this.adjustPickerDimension);
  }

  render() {
    let { scheduleWcif, eventsWcif, usedActivityCodeList, keyboardEnabled } = this.props;
    let { selectedX, selectedY } = this.state;
    if (!keyboardEnabled) {
      selectedX = -1;
      selectedY = -1;
    }
    return (
      <Panel id="activity-picker-panel">
        <Panel.Heading>
          Activity picker
        </Panel.Heading>
        <Panel.Body>
          {eventsWcif.map((value, index) => {
            return (
              <ActivityPickerLine key={value.id}
                                  selectedLine={index == selectedY}
                                  eventWcif={value}
                                  usedActivityCodeList={usedActivityCodeList} selectedX={selectedX}
              />
            );
          })}
          <Col xs={12}>
            <p>
              Want to add a custom activity such as lunch or registration?
              Click and select a timeframe on the calendar!
            </p>
          </Col>
        </Panel.Body>
      </Panel>
    );
  }
}

const ActivityPickerLine = ({ eventWcif, usedActivityCodeList, selectedLine, selectedX }) => (
  <Col xs={12} className="event-picker-line">
    <Row>
      <Col xs={12} md={3} lg={2} className="activity-icon">
        <span className={cn("cubing-icon", `event-${eventWcif.id}`)}></span>
      </Col>
      <Col xs={12} md={9} lg={10}>
        <Row>
          {eventWcif.rounds.map((value, index) => {
            let activities = (
              <ActivitiesForRound key={value.id}
                                  indexInRow={index}
                                  eventId={eventWcif.id}
                                  round={value}
                                  usedActivityCodeList={usedActivityCodeList}
                                  selectedLine={selectedLine}
                                  selectedX={selectedX}
              />
            );
            if (eventWcif.id == "333mbf" || eventWcif.id == "333fm") {
              // For these events the selectedX spreads accross multiple rounds.
              // This corrects the offset.
              selectedX -= formats.byId[value.format].expectedSolveCount;
            }
            return activities;
          })}
        </Row>
      </Col>
    </Row>
  </Col>
);

const ActivitiesForRound = ({ usedActivityCodeList, eventId, round, selectedLine, selectedX, indexInRow }) => {
  if (["333fm", "333mbf"].includes(eventId)) {
    let numberOfAttempts = formats.byId[round.format].expectedSolveCount;
    return _.times(numberOfAttempts, n => (
      <ActivityForAttempt
        activityCode={round.id}
        usedActivityCodeList={usedActivityCodeList}
        key={n}
        attemptNumber={n + 1}
        selected={selectedLine && selectedX === n}
      />
    ));
  } else {
    return (
      <ActivityForAttempt
        usedActivityCodeList={usedActivityCodeList}
        activityCode={round.id}
        selected={selectedLine && selectedX == indexInRow}
        attemptNumber={null}
      />
    );
  }
}

class ActivityForAttempt extends React.Component {
  scrollSelectedIntoView = () => {
    if (this.selectedElement) {
      // Check if the selected element is visible
      let container = $("#activity-picker-panel").find(".panel-body");
      let containerHeight = container.height();
      let containerTop = container.offset().top;
      let elemPos = $(this.selectedElement).offset().top;
      let elemHeight = $(this.selectedElement).height();
      let scrollPos = $(window).scrollTop();
      let visibleHeight = $(window).height();
      if (elemPos < containerTop || elemPos > (containerTop + containerHeight)
          || elemPos > (scrollPos + visibleHeight) || elemPos < (scrollPos - elemHeight)) {
        // then element is not visible, scroll into it
        this.selectedElement.scrollIntoView();
      }
    }
  }

  componentDidMount() {
    this.scrollSelectedIntoView();
  }

  componentDidUpdate() {
    this.scrollSelectedIntoView();
  }

  render() {
    let { usedActivityCodeList, activityCode, attemptNumber, selected } = this.props;
    let { roundNumber } = parseActivityCode(activityCode);
    let tooltipText = roundIdToString(activityCode);
    let text = `R${roundNumber}`;
    if (attemptNumber) {
      tooltipText += `, Attempt ${attemptNumber}`;
      text += `A${attemptNumber}`;
      activityCode += `-a${attemptNumber}`;
    }

    let tooltip = (
      <Tooltip id={`tooltip-${activityCode}`}>
        {tooltipText}
      </Tooltip>
    );
    let outerCssClasses = [
      "activity-in-picker",
      { "col-xs-6 col-md-4 col-lg-3" : !attemptNumber},
      { "col-xs-12 col-md-6 col-lg-4" : attemptNumber},
    ]
    let innerCssClasses = [
      "schedule-activity",
      {"activity-used": (usedActivityCodeList.indexOf(activityCode) > -1)},
      { "selected-activity" : selected},
    ]

    let refFunction = (elem) => {
      if (selected) {
        this.selectedElement = elem;
      }
    }
    return (
      <div className={cn(outerCssClasses)} data-activity-code={activityCode}>
        <OverlayTrigger placement="top" overlay={tooltip}>
          <div className={cn(innerCssClasses)}
               ref={refFunction}
               data-event={`{"name": "${tooltipText}", "activityCode": "${activityCode}"}`}>
            {text}
          </div>
        </OverlayTrigger>
      </div>
    );
  }
}

