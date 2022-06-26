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
    let qualificationTypeInput, qualificationMethodInput, rankingInput, singleInput, averageInput, whenDateInput;

    let onChangeAggregator = () => {
      let type = qualificationTypeInput.value;
      let newQualification = null;
      if (type != "none") {
        newQualification = { type };
        if (qualification) {
          // Copy the deadline from the previous Qualification, or default to today.
          newQualification.whenDate = qualification.whenDate || moment(new Date()).format("YYYY-MM-DD");
        }
        if (qualificationMethodInput) {
          let method = qualificationMethodInput.value;
          newQualification.method = method;
          if (method == "ranking") {
            newQualification.level = rankingInput ? parseInt(rankingInput.value) : 0;
          } else if (type == "single") {
            newQualification.level = singleInput ? parseInt(singleInput.value) : 0;
          } else if (type == "average") {
            newQualification.level = averageInput ? parseInt(averageInput.value) : 0;
          }
        } else {
          newQualification.level = 0;
        }
      }
      console.log(newQualification);
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
    let qualificationMethod = qualification ? qualification.method : "";

    if (qualification && qualification.method == "ranking") {
      valueLabel = I18n.t('qualification.ranking_short');
      qualificationInput = (
        <input type="number"
               id="qualification-number-value"
               min="0"
               className="form-control"
               value={qualification.level}
               onChange={onChangeAggregator}
               ref={c => rankingInput = c} />
      );
    } else if (qualificationType == "single") {
      valueLabel = I18n.t('common.single');
      qualificationInput = (
        <AttemptResultInput eventId={wcifEvent.id}
                            id="qualification-single-value"
                            value={qualification.level}
                            onChange={onChangeAggregator}
                            isAverage={false}
                            ref={c => singleInput = c} />
      );
    } else if (qualificationType == "average") {
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

    let whenDateBlock = qualificationInput ? (
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

    let bottomSection = qualificationType ? (
        <div>
          <div className="form-group">
            <label htmlFor="qualification-method-input" className="col-sm-3 control-label">{ I18n.t('qualification.method_label')}</label>
            <div className="col-sm-9">
              <div className="input-group">
                <select value={qualificationMethod}
                        name="type"
                        autoFocus={autoFocus}
                        onChange={onChangeAggregator}
                        className="form-control"
                        id="qualification-type-input"
                        ref={c => qualificationMethodInput = c}
                >
                  <option value="result">{ I18n.t('qualification.result') }</option>
                  <option value="ranking">{ I18n.t('qualification.ranking_short') }</option>
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
          <label htmlFor="qualification-type-input" className="col-sm-3 control-label">{ I18n.t('qualification.type_label' )}</label>
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
                <option value="none">{ I18n.t('qualification.none') }</option>
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
