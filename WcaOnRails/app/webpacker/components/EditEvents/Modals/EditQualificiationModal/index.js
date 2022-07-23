import React, { useState } from 'react';
import _ from 'lodash';
import useInputState from '../../../../lib/hooks/useInputState';
import { roundIdToString } from '../../../../lib/utils/wcif';
import ButtonActivatedModal from '../ButtonActivatedModal';
import { useDispatch } from '../../../../lib/providers/StoreProvider';
import { updateAdvancementCondition } from '../../store/actions';

/**
 * Shows a modal to edit the advancement condition of a round.
 * @param {Event} wcifEvent
 * @param {Round} wcifRound
 * @returns {React.ReactElement}
 */
export default function EditQualificationModal({
  wcifEvent, wcifRound, roundNumber, disabled,
}) {
  const event = events.byId[wcifEvent.id];
  const { qualification } = wcifRound;
  const dispatch = useDispatch();

  const [type, setType] = useInputState(qualification?.type ?? '');
  const [resultType, setResultType] = useInputState(qualification?.resultType ?? '');
  const [whenDate, setWhenDate] = useInputState(qualification?.whenDate ?? '');
  const [level, setLevel] = useInputState(qualification?.level ?? 0);

  const hasUnsavedChanges = () => (
    !_.isEqual(advancementCondition, type ? { type, level } : null)
  );

  const reset = () => {
    setType(advancementCondition?.type ?? '');
    setResultType(advancementCondition?.resultType ?? '');
    setWhen(advancementCondition?.whenDate ?? '');
    setLevel(advancementCondition?.level ?? 0);
  };

  const handleOk = () => {
    if (hasUnsavedChanges()) {
      dispatch(updateAdvancementCondition(wcifRound.id, type ? {
        type, resultType, whenDate, level,
      } : null));
    }
  };

  const Title = (
    <span>{ I18n.t('qualification.for_event', { event: event.name }) }</span>
  );

  const Trigger = (
    <span>{advanceReqToStrShort(wcifEvent.id, advancementCondition)}</span>
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
      <AdvancementTypeField
        advancementType={type}
        onChange={setType}
      />
      {!!type && (
        <>
          <AdvancementInput type={type} level={level} onChange={setLevel} />
          <br />
          <p>
            {advanceReqToExplanationText(wcifEvent, roundNumber, { type, level })}
          </p>
        </>
      )}
    </ButtonActivatedModal>
  );
}
