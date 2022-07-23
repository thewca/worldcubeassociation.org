import React, { useState } from 'react';
import _ from 'lodash';
import DatePicker from 'react-datepicker';
import { Form } from 'semantic-ui-react';
import i18n from '../../../../lib/i18n';
import events from '../../../../lib/wca-data/events.js.erb';
import useInputState from '../../../../lib/hooks/useInputState';
import { eventQualificationToString } from '../../../../lib/utils/wcif';
import ButtonActivatedModal from '../ButtonActivatedModal';
import { useDispatch } from '../../../../lib/providers/StoreProvider';
import { updateQualificiation } from '../../store/actions';
import AttemptResultField from '../../../Results/WCALive/AttemptResultField/AttemptResultField';
import QualificiationType from './QualificiationTypeInput';
import QualificiationResultType from './QualificationResultTypeInput';

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
          label={i18n.t(`qualification.type.${resultType}`)}
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
 * @param {Round} wcifRound
 * @returns {React.ReactElement}
 */
export default function EditQualificationModal({
  wcifEvent, wcifRound, disabled,
}) {
  const event = events.byId[wcifEvent.id];
  const { qualification } = wcifRound;
  const dispatch = useDispatch();

  const [type, setType] = useState(qualification?.type ?? '');
  const [resultType, setResultType] = useState(qualification?.resultType ?? '');
  const [whenDate, setWhenDate] = useInputState(qualification?.whenDate ?? '');
  const [level, setLevel] = useInputState(qualification?.level ?? 0);

  const hasUnsavedChanges = () => (
    !_.isEqual(qualification, type ? { type, level } : null)
  );

  const reset = () => {
    setType(qualification?.type ?? '');
    setResultType(qualification?.resultType ?? '');
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
    <span>{ i18n.t('qualification.for_event', { event: event.name }) }</span>
  );

  const Trigger = (
    <span>{eventQualificationToString(wcifEvent, wcifEvent.qualification, { short: true })}</span>
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
      <QualificiationType
        advancementType={type}
        onChange={setType}
      />
      <QualificiationResultType
        advancementType={resultType}
        onChange={setResultType}
      />
      {!!type && (
        <>
          <QualificiationInput type={type} level={level} onChange={setLevel} />
          <Form.Field
            label={i18n.t('qualification.when')}
            control={DatePicker}
            onChange={handleDateChange}
            selected={moment(qualification.whenDate).toDate()}
          />
          <br />
          <p>
            {eventQualificationToString(wcifEvent, {
              type, resultType, whenDate, level,
            })}
          </p>
        </>
      )}
    </ButtonActivatedModal>
  );
}
