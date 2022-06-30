import React from 'react';

import DatePicker from 'react-datepicker';
import events from '../../lib/wca-data/events.js.erb';
import AttemptResultInput from './AttemptResultInput';

import { eventQualificationToString } from '../../lib/utils/wcif';
import I18n from '../../lib/i18n';

import 'react-datepicker/dist/react-datepicker.css';

export default {
  Title({ wcifEvent }) {
    const event = events.byId[wcifEvent.id];
    return <span>{ I18n.t('qualification.for_event', { event: event.name }) }</span>;
  },
  Show({ wcifEvent }) {
    return (
      <span>
        {eventQualificationToString(wcifEvent, wcifEvent.qualification, { short: true })}
      </span>
    );
  },
  Input({
    value: qualification, onChange, autoFocus, wcifEvent,
  }) {
    let qualificationResultTypeInput;
    let qualificationTypeInput;
    let rankingInput;
    let singleInput;
    let averageInput;

    const onChangeAggregator = () => {
      const resultType = qualificationResultTypeInput.value;
      let newQualification = null;
      if (resultType !== 'none') {
        newQualification = { resultType };
        if (qualification) {
          // Copy the deadline from the previous Qualification, or default to today.
          newQualification.whenDate = qualification.whenDate || moment(new Date()).format('YYYY-MM-DD');
        }
        if (qualificationTypeInput) {
          const type = qualificationTypeInput.value;
          newQualification.type = type;
          if (type === 'ranking') {
            newQualification.level = rankingInput ? parseInt(rankingInput.value, 10) : 0;
          } else if (type === 'anyResult') {
            newQualification.level = null;
          } else if (resultType === 'single') {
            newQualification.level = singleInput ? parseInt(singleInput.value, 10) : 0;
          } else if (resultType === 'average') {
            newQualification.level = averageInput ? parseInt(averageInput.value, 10) : 0;
          }
        } else {
          newQualification.level = 0;
        }
      }

      onChange(newQualification);
    };

    const onDateSelect = (date) => {
      const newQualification = qualification;
      newQualification.whenDate = moment(date).format('YYYY-MM-DD');
      onChange(newQualification);
    };

    let valueLabel; let
      qualificationInput;
    const helpBlock = qualification ? eventQualificationToString(wcifEvent, qualification) : null;
    const qualificationResultType = qualification ? qualification.resultType : '';
    const qualificationType = qualification ? qualification.type : '';

    if (qualification && qualification.type === 'ranking') {
      valueLabel = I18n.t('qualification.type.ranking');
      qualificationInput = (
        <input
          type="number"
          id="qualification-number-value"
          min="0"
          className="form-control"
          value={qualification.level}
          onChange={onChangeAggregator}
          ref={(c) => {
            rankingInput = c;
          }}
        />
      );
    } else if (qualification && qualification.type === 'attemptResult') {
      if (qualificationResultType === 'single') {
        valueLabel = I18n.t('common.single');
        qualificationInput = (
          <AttemptResultInput
            eventId={wcifEvent.id}
            id="qualification-single-value"
            value={qualification.level}
            onChange={onChangeAggregator}
            isAverage={false}
            ref={(c) => {
              singleInput = c;
            }}
          />
        );
      } else if (qualificationResultType === 'average') {
        valueLabel = I18n.t('common.average');
        qualificationInput = (
          <AttemptResultInput
            eventId={wcifEvent.id}
            id="qualification-average-value"
            value={qualification.level}
            onChange={onChangeAggregator}
            isAverage
            ref={(c) => {
              averageInput = c;
            }}
          />
        );
      }
    }

    const whenDateBlock = qualificationInput ? (
      <div className="form-group">
        <label htmlFor="whenDate-input" className="col-sm-3 control-label">
          { I18n.t('qualification.deadline.description') }
        </label>
        <div className="col-sm-9">
          <DatePicker
            name="whenDate"
            onChange={(date) => onDateSelect(date)}
            className="form-control"
            id="whenDate-input"
            selected={moment(qualification.whenDate).toDate()}
          />
        </div>
      </div>
    ) : null;

    const bottomSection = qualificationResultType ? (
      <div>
        <div className="form-group">
          <label htmlFor="qualification-type-input" className="col-sm-3 control-label">{ I18n.t('qualification.type_label')}</label>
          <div className="col-sm-9">
            <div className="input-group">
              <select
                value={qualificationType}
                name="type"
                autoFocus={autoFocus}
                onChange={onChangeAggregator}
                className="form-control"
                id="qualification-result-type-input"
                ref={(c) => {
                  qualificationTypeInput = c;
                }}
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
          <label htmlFor="qualification-result-type-input" className="col-sm-3 control-label">{ I18n.t('qualification.result_type')}</label>
          <div className="col-sm-9">
            <div className="input-group">
              <select
                value={qualificationResultType}
                name="type"
                autoFocus={autoFocus}
                onChange={onChangeAggregator}
                className="form-control"
                id="qualification-result-type-input"
                ref={(c) => {
                  qualificationResultTypeInput = c;
                }}
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
