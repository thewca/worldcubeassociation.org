import React, { useState } from 'react';
import _ from 'lodash';
import DatePicker from 'react-datepicker';
import { Form, Label } from 'semantic-ui-react';
import i18n from '../../../../lib/i18n';
import events from '../../../../lib/wca-data/events.js.erb';
import { eventQualificationToString } from '../../../../lib/utils/wcif';
import { useDispatch } from '../../../../lib/providers/StoreProvider';
import useInputState from '../../../../lib/hooks/useInputState';
import AttemptResultField from '../../../Results/WCALive/AttemptResultField/AttemptResultField';
import { updateQualificiation } from '../../store/actions';
import ButtonActivatedModal from '../ButtonActivatedModal';
import QualificiationType from './QualificiationTypeInput';
import QualificiationResultType from './QualificationResultTypeInput';

import 'react-datepicker/dist/react-datepicker.css';

/**
 *
 * @param {{
 *  type: 'attemptResult' | 'ranking',
 *  resultType: 'single' | 'average',
 *  level: number,
 * }} props
 * @returns
 */
function QualificiationInput({
  type, resultType, level, onChange,
}) {
  switch (type) {
    case 'attemptResult':
      return (
        <AttemptResultField
          value={level}
          onChange={(value) => onChange(value)}
          label={i18n.t(`common.${resultType}`)}
        />
      );
    case 'ranking':
      return (
        <input
          type="number"
          min={1}
          value={level}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          label={i18n.t('qualification.type.ranking')}
        />
      );
    default:
      return null;
  }
}

/**
 * Shows a modal to edit the qualifiication of a round.
 * @param {Event} wcifEvent
 * @returns {React.ReactElement}
 */
export default function EditQualificationModal({
  wcifEvent, disabled,
}) {
  const event = events.byId[wcifEvent.id];
  const { qualification } = wcifEvent;
  const dispatch = useDispatch();

  const [resultType, setResultType] = useInputState(qualification?.resultType ?? 0);
  const [type, setType] = useInputState(qualification?.type ?? 'attemptResult');
  const [whenDate, setWhenDate] = useState(qualification?.whenDate ?? '');
  const [level, setLevel] = useState(qualification?.level || 0);

  const hasUnsavedChanges = () => (
    !_.isEqual(qualification, {
      resultType, type, whenDate, level,
    })
  );

  const reset = () => {
    setResultType(qualification?.resultType ?? '');
    setType(qualification?.type ?? '');
    setWhenDate(qualification?.whenDate ?? '');
    setLevel(qualification?.level ?? 0);
  };

  const handleOk = () => {
    if (hasUnsavedChanges()) {
      dispatch(updateQualificiation(wcifEvent.id, type ? {
        type, resultType, whenDate, level,
      } : null));
    }
  };

  const handleDateChange = (date) => {
    setWhenDate(moment(date).format('YYYY-MM-DD'));
  };

  const Title = (
    <span>{i18n.t('qualification.for_event', { event: event.name })}</span>
  );

  const Trigger = (
    <span>{eventQualificationToString(wcifEvent, qualification, { short: true })}</span>
  );

  return (
    <ButtonActivatedModal
      trigger={Trigger}
      title={Title}
      reset={reset}
      onOk={handleOk}
      hasUnsavedChanges={hasUnsavedChanges()}
      disabled={disabled}
    >
      <QualificiationResultType
        qualificationResultType={resultType}
        onChange={setResultType}
      />
      {resultType ? (
        <QualificiationType
          qualificationType={type}
          onChange={setType}
        />
      ) : null}
      {(resultType && type) ? (
        <>
          <QualificiationInput
            type={type}
            level={level}
            resultType={resultType}
            onChange={setLevel}
          />
          <Form.Field>
            <Label>{i18n.t('qualification.deadline.description')}</Label>
            <DatePicker
              onChange={handleDateChange}
              selected={whenDate ? new Date(whenDate) : null}
              dateFormat="yyyy-MM-dd"
              dateFormatCalendar="yyyy"
            />
          </Form.Field>
          <br />
          <p>
            {eventQualificationToString(wcifEvent, {
              type, resultType, whenDate, level,
            })}
          </p>
        </>
      ) : null}
    </ButtonActivatedModal>
  );
}
