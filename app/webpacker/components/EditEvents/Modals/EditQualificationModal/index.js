import React, { useMemo, useState } from 'react';
import _ from 'lodash';
import { Form, Label } from 'semantic-ui-react';
import I18n from '../../../../lib/i18n';
import { events } from '../../../../lib/wca-data.js.erb';
import { eventQualificationToString } from '../../../../lib/utils/wcif';
import { useDispatch } from '../../../../lib/providers/StoreProvider';
import useInputState, { useInputUpdater } from '../../../../lib/hooks/useInputState';
import AttemptResultField from '../../../EditResult/WCALive/AttemptResultField/AttemptResultField';
import MbldPointsField from '../../../EditResult/WCALive/AttemptResultField/MbldPointsField';
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
  const onInputChange = useInputUpdater(onChange, true);

  switch (type) {
    case 'attemptResult':
      return (
        eventId === '333mbf'
          ? (
            <MbldPointsField
              eventId={eventId}
              value={level}
              onChange={onChange}
              label={<Label>{I18n.t(`common.${resultType}`)}</Label>}
            />
          )
          : (
            <AttemptResultField
              eventId={eventId}
              value={level}
              onChange={onChange}
              label={<Label>{I18n.t(`common.${resultType}`)}</Label>}
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
          onChange={onInputChange}
          label={(
            <Label>
              {I18n.t('qualification.type.ranking')}
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

  const v1ConditionType = useMemo(() => {
    const v2Type = qualification?.resultCondition?.type ?? '';

    if (v2Type === 'resultAchieved') {
      const v2Value = qualification?.resultCondition?.value;

      if (v2Value === null) {
        return 'anyResult';
      }
    }

    return v2Type.replace('resultAchieved', 'attemptResult');
  }, [qualification?.resultCondition]);

  const [conditionScope, setConditionScope] = useInputState(qualification?.resultCondition?.scope ?? '');
  const [conditionType, setConditionType] = useInputState(v1ConditionType);
  const [latestResultDate, setLatestResultDate] = useState(qualification?.latestResultDate ?? '');
  const [conditionValue, setConditionValue] = useState(qualification?.resultCondition?.value ?? 0);

  const qualificationStateWcif = useMemo(() => {
    const v2ConditionType = conditionType
      .replace('attemptResult', 'resultAchieved')
      .replace('anyResult', 'resultAchieved');

    const v2ConditionValue = conditionType === 'anyResult' ? null : conditionValue;

    return ({
      earliestResultDate: null,
      latestResultDate,
      resultCondition: {
        type: v2ConditionType,
        scope: conditionScope,
        value: v2ConditionValue,
      },
    });
  }, [conditionScope, conditionType, conditionValue, latestResultDate]);

  const hasUnsavedChanges = useMemo(() => (
    !_.isEqual(qualification, qualificationStateWcif)
  ), [qualification, qualificationStateWcif]);

  const reset = () => {
    setConditionScope(qualification?.resultCondition?.scope ?? '');
    setConditionType(v1ConditionType ?? 'attemptResult');
    setLatestResultDate(qualification?.latestResultDate ?? '');
    setConditionValue(qualification?.resultCondition?.value ?? 0);
  };

  const handleOk = () => {
    if (hasUnsavedChanges) {
      dispatch(updateQualification(
        wcifEvent.id,
        conditionScope ? qualificationStateWcif : null,
      ));
    }
  };

  const title = I18n.t('qualification.for_event', { event: event.name });
  const trigger = eventQualificationToString(wcifEvent, qualification, { short: true, isV2: true });

  return (
    <ButtonActivatedModal
      trigger={trigger}
      title={title}
      reset={reset}
      onOk={handleOk}
      hasUnsavedChanges={hasUnsavedChanges}
      disabled={disabled}
      tooltip={disabledReason}
      triggerButtonProps={{ name: 'qualification' }}
    >
      <QualificationResultType
        qualificationResultType={conditionScope}
        onChange={setConditionScope}
        eventId={event.id}
      />
      {conditionScope ? (
        <QualificationType
          qualificationType={conditionType}
          onChange={setConditionType}
        />
      ) : null}
      {(conditionScope && conditionType) ? (
        <>
          <QualificationInput
            type={conditionType}
            level={conditionValue}
            resultType={conditionScope}
            onChange={setConditionValue}
            eventId={event.id}
          />
          <Form.Field>
            <Label>{I18n.t('qualification.deadline.description')}</Label>
            <UtcDatePicker
              onChange={setLatestResultDate}
              isoDate={latestResultDate}
            />
          </Form.Field>
          <br />
          <p>
            {eventQualificationToString(wcifEvent, qualificationStateWcif, { isV2: true })}
          </p>
        </>
      ) : null}
    </ButtonActivatedModal>
  );
}
