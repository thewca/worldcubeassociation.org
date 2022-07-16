import React, { useState } from 'react';
import _ from 'lodash';
import formats from '../../../../lib/wca-data/formats.js.erb';
import useInputState from '../../../../lib/hooks/useInputState';
import { roundIdToString } from '../../../../lib/utils/wcif';
import { roundCutoffToString } from '../../utils';
import ButtonActivatedModal from '../ButtonActivatedModal';
import CutoffFormatField from './CutoffFormatInput';
import { useDispatch } from '../../../../lib/providers/StoreProvider';
import { updateCutoff } from '../../store/actions';
import AttemptResultField from '../../../Results/WCALive/AttemptResultField/AttemptResultField';

/**
 * Developer notes: "cutoffFormat" and "NumberOfAttempts" is used interchangably for written clarity
 * A cutoff is made up of a number of attempts and a format.
 * This format is essentially a "number of attempts"
 * The cutoff format is stored as "cutoff.numberOfAttempts" in the round object in the wcif.
 */

/**
 * Shows a modal to edit the cutoff of a round.
 * @param {Event} wcifEvent
 * @param {Round} wcifRound
 * @returns {React.ReactElement}
 */
export default function EditCutoffModal({ wcifEvent, wcifRound, disabled }) {
  const { cutoff, format } = wcifRound;
  const dispatch = useDispatch();

  const [numberOfAttempts, setNumberOfAttempts] = useInputState(cutoff?.numberOfAttempts ?? 0);
  const [attemptResult, setAttemptResult] = useState(cutoff?.attemptResult ?? 0);

  const cutoffFormats = formats.byId[format].allowedFirstPhaseFormats;

  const explanationText = (
    numberOfAttempts > 0 ? roundCutoffToString({
      ...wcifRound,
      ...{ numberOfAttempts, attemptResult },
    }) : null
  );

  const hasUnsavedChanges = () => (
    !_.isEqual(cutoff, numberOfAttempts
      ? { numberOfAttempts, attemptResult }
      : null)
  );

  const reset = () => {
    setNumberOfAttempts(cutoff?.numberOfAttempts ?? 0);
    setAttemptResult(cutoff?.attemptResult ?? 0);
  };

  const handleOk = () => {
    if (hasUnsavedChanges()) {
      dispatch(updateCutoff(wcifRound.id, numberOfAttempts
        ? { numberOfAttempts, attemptResult }
        : null));
    }
  };

  const Title = (
    <span>
      {`Cutoff for ${roundIdToString(wcifRound.id)}`}
    </span>
  );

  const Trigger = (
    <span>
      {roundCutoffToString(wcifRound, { short: true })}
    </span>
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
      <div>
        Cutoff format
      </div>
      <CutoffFormatField
        cutoffFormats={cutoffFormats}
        cutoffFormat={numberOfAttempts}
        wcifRound={wcifRound}
        onChange={setNumberOfAttempts}
      />
      {numberOfAttempts > 0 && (
        <>
          <div>
            Cutoff
          </div>
          <AttemptResultField
            label="Result"
            eventId={wcifEvent.id}
            value={attemptResult}
            onChange={setAttemptResult}
          />
        </>
      )}

      {numberOfAttempts < 0 && <p>{explanationText}</p>}
    </ButtonActivatedModal>
  );
}
