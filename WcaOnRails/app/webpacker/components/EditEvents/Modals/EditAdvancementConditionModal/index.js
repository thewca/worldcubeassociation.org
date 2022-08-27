import React, { useState } from 'react';
import _ from 'lodash';
import useInputState from '../../../../lib/hooks/useInputState';
import { roundIdToString } from '../../../../lib/utils/wcif';
import ButtonActivatedModal from '../ButtonActivatedModal';
import { useDispatch } from '../../../../lib/providers/StoreProvider';
import { updateAdvancementCondition } from '../../store/actions';
import AttemptResultField from '../../../Results/WCALive/AttemptResultField/AttemptResultField';
import { matchResult } from '../../../../lib/utils/edit-events';
import AdvancementTypeField from './AdvancementTypeInput';

const MIN_ADVANCE_PERCENT = 1;
const MAX_ADVANCE_PERCENT = 75;

/**
 * Formats an advancement requirement as a string
 * @param {String} advancementCondition
 * @returns
 */
function advanceReqToStrShort(eventId, advancementCondition) {
  if (!advancementCondition) {
    return '-';
  }

  switch (advancementCondition.type) {
    case 'ranking':
      return `Top ${advancementCondition.level}`;
    case 'percent':
      return `Top ${advancementCondition.level}%`;
    case 'attemptResult':
      return matchResult(advancementCondition.level, eventId, {
        short: true,
      });
    default:
      throw new Error(
        `Unrecognized advancementCondition type: ${advancementCondition.type}`,
      );
  }
}

/**
 * Formats an advancement requirement as a string
 * @returns {String}
 */
const advanceReqToExplanationText = (wcifEvent, roundNumber, { type, level }) => {
  switch (type) {
    case 'ranking':
      return `The top ${level} competitors from round ${roundNumber} will advance to round ${roundNumber + 1}.`;
    case 'percent':
      return `The top ${level}% competitors from round ${roundNumber} will advance to round ${roundNumber + 1}.`;
    case 'attemptResult':
      return `Everyone in round ${roundNumber} with a result ${matchResult(level, wcifEvent.id)
        } will advance to round ${roundNumber + 1}.`;
    default:
      return '';
  }
};

function AdvancementInput({ type, level, onChange }) {
  switch (type) {
    case 'ranking':
      return (
        <input
          type="number"
          min={1}
          value={level}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          label="Ranking"
        />
      );
    case 'percent':
      return (
        <input
          type="number"
          min={MIN_ADVANCE_PERCENT}
          max={MAX_ADVANCE_PERCENT}
          value={level}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          label="Percent"
        />
      );
    case 'attemptResult':
      return (
        <AttemptResultField
          value={level}
          onChange={(value) => onChange(value)}
          label="Result"
        />
      );
    default:
      return null;
  }
}

const defaultValueAdvancementValue = (type) => (type === 'percent' ? 75 : 0);

/**
 * Shows a modal to edit the advancement condition of a round.
 * @param {Event} wcifEvent
 * @param {Round} wcifRound
 * @returns {React.ReactElement}
 */
export default function EditAdvancementConditionModal({
  wcifEvent, wcifRound, roundNumber, disabled,
}) {
  const { advancementCondition } = wcifRound;
  const dispatch = useDispatch();

  const [type, setType] = useInputState(advancementCondition?.type ?? '');
  const [level, setLevel] = useState(advancementCondition?.level
    ?? defaultValueAdvancementValue(type));

  const hasUnsavedChanges = () => (
    !_.isEqual(advancementCondition, type ? { type, level } : null)
  );

  const reset = () => {
    setType(advancementCondition?.type ?? '');
    setLevel(advancementCondition?.level ?? 0);
  };

  const handleOk = () => {
    if (hasUnsavedChanges()) {
      dispatch(updateAdvancementCondition(wcifRound.id, type ? { type, level } : null));
    }
  };

  const Title = `Requirement to advance past ${roundIdToString(wcifRound.id)}`;
  const Trigger = advanceReqToStrShort(wcifEvent.id, advancementCondition);

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
