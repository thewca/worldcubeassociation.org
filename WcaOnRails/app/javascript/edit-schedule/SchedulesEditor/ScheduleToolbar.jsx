import React from 'react'
import {
  Button,
  ButtonToolbar,
  Col,
  OverlayTrigger,
  Popover,
  Row,
  Tooltip,
} from 'react-bootstrap'
import { scheduleElementSelector } from './fullcalendar'

export class ScheduleToolbar extends React.Component {

  constructor(props) {
    super(props);
    let { handleKeyboardChange } = props;
    $(window).keydown(function(event) {
      // ctrl + i
      if (event.ctrlKey && !event.shiftKey && event.which == 73) {
        handleKeyboardChange();
      }
    });
  }

  componentWillMount() {
    let calendarOptions = {};

    Object.keys(calendarOptionsInfo).forEach(function(optionName) {
      calendarOptions[optionName] = calendarOptionsInfo[optionName].defaultValue;
    });
    this.setState({
      calendarOptions: calendarOptions,
    });
  }

  handleCalendarOptionChange = (optionName, e) => {
    e.preventDefault();
    let currentOptions = this.state.calendarOptions;
    currentOptions[optionName] = e.target.value;
    $(scheduleElementSelector).fullCalendar("option", currentOptions);
    this.setState({ calendarOptions: currentOptions });
  }


  render() {
    let { keyboardEnabled, handleKeyboardChange } = this.props;
    return (
      <ButtonToolbar>
        <OverlayTrigger trigger="click"
                        rootClose
                        overlay={<CalendarHelp />}
                        placement="bottom"
        >
          <Button><i className="fa fa-question-circle"></i></Button>
        </OverlayTrigger>
        <OverlayTrigger trigger="click"
                        rootClose
                        placement="bottom"
                        overlay={<CalendarSettings currentSettings={this.state.calendarOptions}
                                                   handlePropChange={this.handleCalendarOptionChange}
                                 />}
        >
          <OverlayTrigger overlay={tooltipSettings} placement="top">
            <Button><i className="fa fa-cog"></i></Button>
          </OverlayTrigger>
        </OverlayTrigger>
        <OverlayTrigger overlay={<TooltipKeyboard enabled={keyboardEnabled}/>} placement="top">
          <Button onClick={handleKeyboardChange} active={keyboardEnabled}>
            <i className="fa fa-keyboard-o"></i>
          </Button>
        </OverlayTrigger>
      </ButtonToolbar>
    );
  }
}

const CalendarHelp = ({ ...props }) => {
// See https://github.com/react-bootstrap/react-bootstrap/issues/1345#issuecomment-142133819
// for why we pass down ...props
  return (
    <Popover id="calendar-help-popover" title="Keyboard shortcuts help" {...props} >
      <dl className="row">
        <dt className="col-xs-4"><i className="fa fa-keyboard-o"/> or<br/> [C] + i</dt>
        <dd className="col-xs-8">Toggle keyboard shortcuts</dd>
        <dt className="col-xs-4">Arrow keys</dt>
        <dd className="col-xs-8">Change selected event in calendar</dd>
        <dt className="col-xs-4">[S] + Arrow keys</dt>
        <dd className="col-xs-8">Change selected activity in picker</dd>
        <dt className="col-xs-4">[Enter]</dt>
        <dd className="col-xs-8">Add selected activity after selected event</dd>
        <dt className="col-xs-4">[Del]</dt>
        <dd className="col-xs-8">Remove selected event</dd>
        <dt className="col-xs-4">[C] + Arrow keys</dt>
        <dd className="col-xs-8">Move selected event around in calendar</dd>
        <dt className="col-xs-4">[C] + [S] + up/down</dt>
        <dd className="col-xs-8">Shrink/Expand selected event in calendar</dd>
        <dt className="col-xs-4">[C] + [S] + click</dt>
        <dd className="col-xs-8">Show contextual menu for event</dd>
      </dl>
      <hr />
      <b>[C]:</b> ctrl key, <b>[S]:</b> shift key
    </Popover>
  );
}

const tooltipSettings = (
  <Tooltip id="tooltip-calendar-settings">
    Click to change the calendar's settings.
  </Tooltip>
);

const TooltipKeyboard = ({ enabled, ...props }) => (
  <Tooltip id="tooltip-enable-keyboard" {...props}>
    Click to { enabled ? "disable" : "enable" } keyboard shortcuts
  </Tooltip>
);


export const calendarOptionsInfo = {
  slotDuration: {
    label: "Minutes per row",
    defaultValue: "00:30:00",
    options: {
      "5": "00:05:00",
      "15": "00:15:00",
      "20": "00:20:00",
      "30": "00:30:00",
    },
  },
  minTime: {
    label: "Calendar starts at",
    defaultValue: "8:00:00",
    options: hours(),
  },
  maxTime: {
    label: "Calendar ends at",
    defaultValue: "20:00:00",
    options: hours(),
  },
};

const CalendarSettingsOption = ({selected, optionName, handlePropChange}) => {
  let optionProps = calendarOptionsInfo[optionName];
  return (
    <Col xs={12}>
      <Row>
        <Col xs={6} className="setting-label">
          {optionProps.label}
        </Col>
        <Col xs={6}>
          <select className="form-control" value={selected} onChange={e => handlePropChange(optionName, e)}>
            {_.map(optionProps.options, function(value, key) {
              return (<option key={value} value={value}>{key}</option>)
            })}
          </select>
        </Col>
      </Row>
    </Col>
  );
}

function hours() {
  let options = {};
  for (let i = 0; i < 24; i++) {
    options[i] = `${i}:00:00`;
  }
  return options;
}

const CalendarSettings = ({ currentSettings, handlePropChange, ...props}) => {
// See https://github.com/react-bootstrap/react-bootstrap/issues/1345#issuecomment-142133819
// for why we pass down ...props
  return (
    <Popover id="calendar-settings-popover" title="Calendar settings" {...props} >
      <Row>
        {Object.keys(calendarOptionsInfo).map(function(optionName) {
          return (
            <CalendarSettingsOption optionName={optionName}
                                    key={optionName}
                                    selected={currentSettings[optionName]}
                                    handlePropChange={handlePropChange}
            />
          );
        })}
      </Row>
    </Popover>
  );
}

