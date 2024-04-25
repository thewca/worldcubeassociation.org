import React, { useState } from 'react';
import _ from 'lodash';
import { Form, Label } from 'semantic-ui-react';
import i18n from '../../../../lib/i18n';
import { events } from '../../../../lib/wca-data.js.erb';
import { eventQualificationToString } from '../../../../lib/utils/wcif';
import { useDispatch } from '../../../../lib/providers/StoreProvider';
import useInputState from '../../../../lib/hooks/useInputState';
import AttemptResultField from '../../../Results/WCALive/AttemptResultField/AttemptResultField';
import MbldPointsField from '../../../Results/WCALive/AttemptResultField/MbldPointsField';
import { updateQualification } from '../../store/actions';
import ButtonActivatedModal from '../ButtonActivatedModal';
import QualificationType from './QualificationTypeInput';
import QualificationResultType from './QualificationResultTypeInput';
import UtcDatePicker from '../../../wca/UtcDatePicker';

/**
 *
 * @param {{
 *  type: 'attemptResult' | 'ranking',
 *  resultType: 'single' | 'average',
 *  level: number,
 * }} props
 * @returns
 */
function QualificationInput({
  type, resultType, level, onChange, eventId,
}) {
  switch (type) {
    case 'attemptResult':
      return (
        eventId === '333mbf'
          ? (
            <MbldPointsField
              eventId={eventId}
              value={level}
              onChange={(newLevel) => onChange(newLevel)}
              label={<Label>{i18n.t(`common.${resultType}`)}</Label>}
            />
          )
          : (
            <AttemptResultField
              eventId={eventId}
              value={level}
              onChange={(value) => onChange(value)}
              label={<Label>{i18n.t(`common.${resultType}`)}</Label>}
              resultType={resultType}
            />
          )
      );
    case 'ranking':
      return (
        <Form.Input
          type="number"
          min={1}
          value={level}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          label={(
            <Label>
              {i18n.t('qualification.type.ranking')}
            </Label>
          )}
        />
      );
    default:
      return null;
  }
}

/**
 * Shows a modal to edit the qualification of a round.
 * @param {Event} wcifEvent
 * @param {boolean} disabled - to prevent adding/changing qualifications
 * @param {string | undefined} disabledReason - to show as tooltip
 * @returns {React.ReactElement}
 */
export default function EditQualificationModal({
  wcifEvent, disabled, disabledReason,
}) {
  const event = events.byId[wcifEvent.id];
  const { qualification } = wcifEvent;
  const dispatch = useDispatch();

  const [resultType, setResultType] = useInputState(qualification?.resultType ?? 0);
  const [type, setType] = useInputState(qualification?.type ?? 'attemptResult');
  const [whenDate, setWhenDate] = useState(qualification?.whenDate ?? '');
  const [level, setLevel] = useState(qualification?.level || 0);

  // todo: can convert this to a const (ie not a function)?
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
      dispatch(updateQualification(wcifEvent.id, resultType ? {
        type, resultType, whenDate, level,
      } : null));
    }
  };

  const title = i18n.t('qualification.for_event', { event: event.name });
  const trigger = eventQualificationToString(wcifEvent, qualification, { short: true });

  return (
    <ButtonActivatedModal
      trigger={trigger}
      title={title}
      reset={reset}
      onOk={handleOk}
      hasUnsavedChanges={hasUnsavedChanges()}
      disabled={disabled}
      tooltip={disabledReason}
      triggerButtonProps={{ name: 'qualification' }}
    >
      <QualificationResultType
        qualificationResultType={resultType}
        onChange={setResultType}
        eventId={event.id}
      />
      {resultType ? (
        <QualificationType
          qualificationType={type}
          onChange={setType}
        />
      ) : null}
      {(resultType && type) ? (
        <>
          <QualificationInput
            type={type}
            level={level}
            resultType={resultType}
            onChange={setLevel}
            eventId={event.id}
          />
          <Form.Field>
            <Label>{i18n.t('qualification.deadline.description')}</Label>
            <UtcDatePicker
              onChange={setWhenDate}
              selected={whenDate}
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
