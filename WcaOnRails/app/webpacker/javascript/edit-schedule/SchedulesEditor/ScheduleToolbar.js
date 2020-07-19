import React from 'react';
import {
  Button,
  ButtonToolbar,
  Col,
  OverlayTrigger,
  Popover,
  Row,
  Tooltip,
} from 'react-bootstrap';
import _ from 'lodash';
import { scheduleElementSelector } from './ses';

/* eslint react/prop-types: "off" */
// The errors below are bahavior caused by our usage of react-bootstrap
/* eslint react/jsx-props-no-spreading: "off" */

const hours = _.fromPairs(_.times(24, (i) => [i, `${i}:00:00`]));

export const calendarOptionsInfo = {
  slotDuration: {
    label: 'Minutes per row',
    defaultValue: '00:15:00',
    options: {
      5: '00:05:00',
      15: '00:15:00',
      20: '00:20:00',
      30: '00:30:00',
    },
  },
  minTime: {
    label: 'Calendar starts at',
    defaultValue: '8:00:00',
    options: hours,
  },
  maxTime: {
    label: 'Calendar ends at',
    defaultValue: '20:00:00',
    options: hours,
  },
};

const tooltipSettings = (
  <Tooltip id="tooltip-calendar-settings">
    Click to change the calendar&rsquo;s settings.
  </Tooltip>
);

export class ScheduleToolbar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      calendarOptions: _.mapValues(calendarOptionsInfo, 'defaultValue'),
    };
    this.keyboardHandler = this.keyboardHandler.bind(this);
  }

  componentDidMount() {
    $(window).keydown(this.keyboardHandler);
  }

  componentWillUnmount() {
    $(window).off('keydown', this.keyboardHandler);
  }

  keyboardHandler(event) {
    const { handleKeyboardChange } = this.props;
    // ctrl + i
    if (event.ctrlKey && !event.shiftKey && event.which === 73) {
      handleKeyboardChange();
    }
  }

  render() {
    const { keyboardEnabled, handleKeyboardChange } = this.props;

    const handleCalendarOptionChange = (optionName, e) => {
      e.preventDefault();
      const { calendarOptions } = this.state;
      const newOptions = {
        ...calendarOptions,
        [optionName]: e.target.value,
      };
      $(scheduleElementSelector).fullCalendar('option', newOptions);
      this.setState({ calendarOptions: newOptions });
    };

    const { calendarOptions } = this.state;

    return (
      <ButtonToolbar>
        <OverlayTrigger
          trigger="click"
          rootClose
          overlay={<CalendarHelp />}
          placement="bottom"
        >
          <Button><i className="fas fa-question-circle" /></Button>
        </OverlayTrigger>
        <OverlayTrigger
          trigger="click"
          rootClose
          placement="bottom"
          overlay={(
            <CalendarSettings
              currentSettings={calendarOptions}
              handlePropChange={handleCalendarOptionChange}
            />
)}
        >
          <OverlayTrigger overlay={tooltipSettings} placement="top">
            <Button><i className="fas fa-cog" /></Button>
          </OverlayTrigger>
        </OverlayTrigger>
        <OverlayTrigger overlay={<TooltipKeyboard enabled={keyboardEnabled} />} placement="top">
          <Button onClick={handleKeyboardChange} active={keyboardEnabled}>
            <i className="fas fa-keyboard" />
          </Button>
        </OverlayTrigger>
      </ButtonToolbar>
    );
  }
}

// See https://github.com/react-bootstrap/react-bootstrap/issues/1345#issuecomment-142133819
// for why we pass down ...props
const CalendarHelp = ({ ...props }) => (
  <Popover id="calendar-help-popover" title="Keyboard shortcuts help" {...props}>
    <dl className="row">
      <dt className="col-xs-4">
        <i className="fas fa-keyboard" />
        {' '}
        or
        <br />
        {' '}
        [C] + i
      </dt>
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
    <b>[C]:</b>
    {' '}
    ctrl key,
    <b>[S]:</b>
    {' '}
    shift key
  </Popover>
);

const TooltipKeyboard = ({ enabled, ...props }) => (
  <Tooltip id="tooltip-enable-keyboard" {...props}>
    Click to
    {' '}
    { enabled ? 'disable' : 'enable' }
    {' '}
    keyboard shortcuts
  </Tooltip>
);


const CalendarSettingsOption = ({ selected, optionName, handlePropChange }) => {
  const optionProps = calendarOptionsInfo[optionName];
  return (
    <Col xs={12}>
      <Row>
        <Col xs={6} className="setting-label">
          {optionProps.label}
        </Col>
        <Col xs={6}>
          <select className="form-control" value={selected} onChange={(e) => handlePropChange(optionName, e)}>
            {_.map(optionProps.options, (value, key) => (
              <option key={value} value={value}>{key}</option>))}
          </select>
        </Col>
      </Row>
    </Col>
  );
};

// See https://github.com/react-bootstrap/react-bootstrap/issues/1345#issuecomment-142133819
// for why we pass down ...props
const CalendarSettings = ({ currentSettings, handlePropChange, ...props }) => (
  <Popover id="calendar-settings-popover" title="Calendar settings" {...props}>
    <Row>
      {Object.keys(calendarOptionsInfo).map((optionName) => (
        <CalendarSettingsOption
          optionName={optionName}
          key={optionName}
          selected={currentSettings[optionName]}
          handlePropChange={handlePropChange}
        />
      ))}
    </Row>
  </Popover>
);
