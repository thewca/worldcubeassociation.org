import React, { useState } from 'react';
import _ from 'lodash';
import { Label } from 'semantic-ui-react';
import { formats } from '../../../../lib/wca-data.js.erb';
import useInputState from '../../../../lib/hooks/useInputState';
import { roundIdToString } from '../../../../lib/utils/wcif';
import { roundCutoffToString } from '../../utils';
import ButtonActivatedModal from '../ButtonActivatedModal';
import CutoffFormatField from './CutoffFormatInput';
import { useDispatch } from '../../../../lib/providers/StoreProvider';
import { updateCutoff } from '../../store/actions';
import AttemptResultField from '../../../EditResult/WCALive/AttemptResultField/AttemptResultField';
import MbldPointsField from '../../../EditResult/WCALive/AttemptResultField/MbldPointsField';

/**
 * Developer notes: "cutoffFormat" and "NumberOfAttempts" is used interchangeably
 * for written clarity. A cutoff is made up of a number of attempts and a format.
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
  const [resultValue, setResultValue] = useState(cutoff?.resultValue ?? 0);

  const cutoffFormats = formats.byId[format].allowedFirstPhaseFormats;
  // temporary fix until the backend properly tells us the valid formats; see issue 7555
  const is666or777 = wcifEvent.id === '666' || wcifEvent.id === '777';
  const sanitizedCutoffFormats = is666or777
    ? cutoffFormats.filter((cutoffFormat) => cutoffFormat !== '2')
    : cutoffFormats;

  const explanationText = (
    numberOfAttempts > 0 ? roundCutoffToString({
      ...wcifRound,
      ...{ numberOfAttempts, resultValue },
    }, { isV2: true }) : null
  );

  const hasUnsavedChanges = () => (
    !_.isEqual(cutoff, numberOfAttempts
      ? { numberOfAttempts, resultValue }
      : null)
  );

  const reset = () => {
    setNumberOfAttempts(cutoff?.numberOfAttempts ?? 0);
    setResultValue(cutoff?.resultValue ?? 0);
  };

  const handleOk = () => {
    if (hasUnsavedChanges()) {
      dispatch(updateCutoff(wcifRound.id, numberOfAttempts
        ? { numberOfAttempts, resultValue }
        : null));
    }
  };

  const Title = `Cutoff for ${roundIdToString(wcifRound.id)}`;
  const Trigger = roundCutoffToString(wcifRound, { short: true, isV2: true });

  return (
    <ButtonActivatedModal
      trigger={Trigger}
      triggerButtonProps={{ name: 'cutoff' }}
      title={Title}
      reset={reset}
      onOk={handleOk}
      hasUnsavedChanges={hasUnsavedChanges()}
      disabled={disabled}
    >
      <CutoffFormatField
        cutoffFormats={sanitizedCutoffFormats}
        cutoffFormat={numberOfAttempts}
        wcifRound={wcifRound}
        onChange={setNumberOfAttempts}
      />
      {
        numberOfAttempts > 0 && (
          wcifEvent.id === '333mbf'
            ? (
              <MbldPointsField
                label={<Label>Cutoff Result</Label>}
                eventId={wcifEvent.id}
                value={resultValue}
                onChange={setResultValue}
              />
            )
            : (
              <AttemptResultField
                label={<Label>Cutoff Result</Label>}
                eventId={wcifEvent.id}
                value={resultValue}
                onChange={setResultValue}
                resultType="single"
              />
            )
        )
      }

      {numberOfAttempts < 0 && <p>{explanationText}</p>}
    </ButtonActivatedModal>
  );
}
