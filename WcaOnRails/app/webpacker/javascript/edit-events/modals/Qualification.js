import React from 'react'

import events from '../../wca/events.js.erb'
import formats from '../../wca/formats.js.erb'
import AttemptResultInput from './AttemptResultInput'
import DatePicker from "react-datepicker";

import {
  pluralize,
  matchResult,
  attemptResultToString,
} from './utils'
import {
  roundIdToString,
  parseActivityCode,
} from '../../wca/wcif-utils'

import "react-datepicker/dist/react-datepicker.css";

function toUTCDate(dateString) {
  if (!dateString) {
    return null;
  }
  let date = new Date(dateString);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function eventQualificationToString(wcifEvent, qualification, { short } = {}) {
  if (!qualification) {
    return "-";
  }
  let dateString = "-";
  if (qualification.whenDate) {
    let whenDate = moment(qualification.whenDate).toDate();
    dateString = whenDate.toISOString().substring(0, 10);
  }
  switch (qualification.type) {
    case "ranking":
      return `Top ${qualification.level} competitors by ${dateString}`;
    case "single":
      return `Single of ${attemptResultToString(qualification.level, wcifEvent.id, short)} by ${dateString}`;
    case "average":
      return `Average of ${attemptResultToString(qualification.level, wcifEvent.id, short)} by ${dateString}`;
  }
}

export default {
  Title({ wcifEvent }) {
    return <span>Qualification for {wcifEvent.id}</span>;
  },
  Show({ value: cutoff, wcifEvent }) {
    return <span>{eventQualificationToString(wcifEvent, wcifEvent.qualification, { short: true })}</span>;
  },
  Input({ value: qualification, onChange, autoFocus, wcifEvent }) {
    let qualificationTypeInput, rankingInput, singleInput, averageInput, whenDateInput;

    let onChangeAggregator = () => {
      let type = qualificationTypeInput.value;
      let newQualification = null;
      if (type != "none") {
        newQualification = { type };
        if (qualification) {
          // Copy the deadline from the previous Qualification, or default to today.
          newQualification.whenDate = qualification.whenDate || moment(new Date()).format("YYYY-MM-DD");
        }
        switch (type) {
          case "ranking":
            newQualification.level = rankingInput ? parseInt(rankingInput.value) : 0;
            break;
          case "single":
            newQualification.level = singleInput ? parseInt(singleInput.value) : 0;
            break;
          case "average":
            newQualification.level = averageInput ? parseInt(averageInput.value) : 0;
            break;
          default:
            throw new Error(`Unrecognized value ${type}`);
            break;
        }
      }
      onChange(newQualification);
    };

    let onDateSelect = (date) => {
      let newQualification = qualification;
      newQualification.whenDate = moment(date).format("YYYY-MM-DD");
      onChange(newQualification);
    }

    let valueLabel, qualificationInput;
    let helpBlock = qualification ? eventQualificationToString(wcifEvent, qualification) : null;
    let qualificationType = qualification ? qualification.type : "";
    switch(qualificationType) {
      case "ranking":
        valueLabel = "Top N";
        qualificationInput = (
          <input type="number"
                 id="qualification-number-value"
                 min="0"
                 className="form-control"
                 value={qualification.level}
                 onChange={onChangeAggregator}
                 ref={c => rankingInput = c} />
        );
        break;
      case "single":
        valueLabel = "Single";
        qualificationInput = (
          <AttemptResultInput eventId={wcifEvent.id}
                              id="qualification-single-value"
                              value={qualification.level}
                              onChange={onChangeAggregator}
                              ref={c => singleInput = c} />
        );
        break;
      case "average":
        valueLabel = "Average";
        qualificationInput = (
          <AttemptResultInput eventId={wcifEvent.id}
                              id="qualification-average-value"
                              value={qualification.level}
                              onChange={onChangeAggregator}
                              ref={c => averageInput = c} />
        );
        break;
    }

    let whenDateBlock = qualificationInput ? (
      <div className="form-group">
        <label htmlFor="whenDate-input" className="col-sm-3 control-label">
          Qualification Deadline
        </label>
        <div className="col-sm-9">
          <DatePicker name="whenDate"
                      onChange={date => onDateSelect(date)}
                      className="form-control"
                      id="whenDate-input"
                      selected={moment(qualification.whenDate).toDate()}
                      ref={c => whenDateInput = c}/>
        </div>
      </div>
    ) : null;

    return (
      <div>
        <div className="form-group">
          <label htmlFor="qualification-type-input" className="col-sm-3 control-label">Qualification Type</label>
          <div className="col-sm-9">
            <div className="input-group">
              <select value={qualificationType}
                      name="type"
                      autoFocus={autoFocus}
                      onChange={onChangeAggregator}
                      className="form-control"
                      id="qualification-type-input"
                      ref={c => qualificationTypeInput = c}
              >
                <option value="none">No qualification</option>
                <option value="ranking">Top N competitors</option>
                <option value="single">Single</option>
                <option value="average">Average</option>
              </select>
            </div>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="ranking-input" className="col-sm-3 control-label">
            {valueLabel}
          </label>
          <div className="col-sm-9">
            {qualificationInput}
          </div>
        </div>
        {whenDateBlock}
        {helpBlock}
      </div>
    );
  },
};
