import React from 'react'

import events from '../../lib/wca-data/events.js.erb';
import formats from '../../lib/wca-data/formats.js.erb';
import AttemptResultInput from './AttemptResultInput';
import DatePicker from 'react-datepicker';

import { eventQualificationToString } from '../../lib/utils/wcif';
import I18n from '../../lib/i18n';

import 'react-datepicker/dist/react-datepicker.css';

export default {
  Title({ wcifEvent }) {
    let event = events.byId[wcifEvent.id];
    return <span>{ I18n.t('qualification.for_event', {event: event.name}) }</span>;
  },
  Show({ value: cutoff, wcifEvent }) {
    return <span>{eventQualificationToString(wcifEvent, wcifEvent.qualification, { short: true })}</span>;
  },
  Input({ value: qualification, onChange, autoFocus, wcifEvent }) {
    let qualificationResultTypeInput, qualificationTypeInput, rankingInput, singleInput, averageInput, whenDateInput;

    let onChangeAggregator = () => {
      let resultType = qualificationResultTypeInput.value;
      let newQualification = null;
      if (resultType != "none") {
        newQualification = { resultType };
        if (qualification) {
          // Copy the deadline from the previous Qualification, or default to today.
          newQualification.whenDate = qualification.whenDate || moment(new Date()).format("YYYY-MM-DD");
        }
        if (qualificationTypeInput) {
          let type = qualificationTypeInput.value;
          newQualification.type = type;
          if (type == "ranking") {
            newQualification.level = rankingInput ? parseInt(rankingInput.value) : 0;
          } else if (type == "anyResult") {
            newQualification.level = null;
          } else if (resultType == "single") {
            newQualification.level = singleInput ? parseInt(singleInput.value) : 0;
          } else if (resultType == "average") {
            newQualification.level = averageInput ? parseInt(averageInput.value) : 0;
          }
        } else {
          // Set default values when resultType is newly set.
          newQualification.level = 0;
          newQualification.type = "attemptResult";
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
    let qualificationResultType = qualification ? qualification.resultType : "";
    let qualificationType = qualification ? qualification.type : "";

    if (qualification && qualification.type == "ranking") {
      valueLabel = I18n.t('qualification.type.ranking');
      qualificationInput = (
        <input type="number"
               id="qualification-number-value"
               min="0"
               className="form-control"
               value={qualification.level}
               onChange={onChangeAggregator}
               ref={c => rankingInput = c} />
      );
    } else if (qualification && qualification.type == "attemptResult") {
      if (qualificationResultType == "single") {
        valueLabel = I18n.t('common.single');
        qualificationInput = (
          <AttemptResultInput eventId={wcifEvent.id}
                              id="qualification-single-value"
                              value={qualification.level}
                              onChange={onChangeAggregator}
                              isAverage={false}
                              ref={c => singleInput = c} />
        );
      } else if (qualificationResultType == "average") {
        valueLabel = I18n.t('common.average');
        qualificationInput = (
          <AttemptResultInput eventId={wcifEvent.id}
                              id="qualification-average-value"
                              value={qualification.level}
                              onChange={onChangeAggregator}
                              isAverage={true}
                              ref={c => averageInput = c} />
        );
      }
    }

    let whenDateBlock = qualification && qualification.type != "" ? (
      <div className="form-group">
        <label htmlFor="whenDate-input" className="col-sm-3 control-label">
          { I18n.t('qualification.deadline.description') }
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

    let bottomSection = qualificationResultType ? (
        <div>
          <div className="form-group">
            <label htmlFor="qualification-type-input" className="col-sm-3 control-label">{ I18n.t('qualification.type_label')}</label>
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
                  <option value="attemptResult">{ I18n.t('qualification.type.result') }</option>
                  <option value="ranking">{ I18n.t('qualification.type.ranking') }</option>
                  <option value="anyResult">{ I18n.t('qualification.type.any_result') }</option>
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
    ) : null;

    return (
      <div>
        <div className="form-group">
          <label htmlFor="qualification-result-type-input" className="col-sm-3 control-label">{ I18n.t('qualification.result_type' )}</label>
          <div className="col-sm-9">
            <div className="input-group">
              <select value={qualificationResultType}
                      name="type"
                      autoFocus={autoFocus}
                      onChange={onChangeAggregator}
                      className="form-control"
                      id="qualification-result-type-input"
                      ref={c => qualificationResultTypeInput = c}
              >
                <option value="none">{ I18n.t('qualification.type.none') }</option>
                <option value="single">{ I18n.t('common.single') }</option>
                <option value="average">{ I18n.t('common.average') }</option>
              </select>
            </div>
          </div>
        </div>
        {bottomSection}
      </div>
    );
  },
};