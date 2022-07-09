import React, { useMemo, useState } from 'react';
import _ from 'lodash';
import { roundIdToString } from '../../../../lib/utils/wcif';
import ButtonActivatedModal from '../ButtonActivatedModal';
import { useDispatch } from '../../../../lib/providers/StoreProvider';
import { updateTimeLimit } from '../../store/actions';
import { centisecondsToClockFormat } from '../../../../lib/wca-live/attempts';

/**
 * Shows a modal to edit the timelimit of a round.
 * @param {Event} wcifEvent
 * @param {Round} wcifRound
 * @returns {React.ReactElement}
 */
export default function EditTimeLimitModal({ wcifRound, disabled }) {
  const { timeLimit } = wcifRound;
  const dispatch = useDispatch();

  const [centiSeconds, setCentiSeconds] = useState(timeLimit?.centiSeconds ?? 0);
  const [cumulativeRoundIds, setCumulativeRoundIds] = useState(timeLimit?.cumulativeRoundIds ?? []);

  const hasUnsavedChanges = () => (
    !_.isEqual(timeLimit, { centiSeconds, cumulativeRoundIds })
  );

  const reset = () => {
    setCentiSeconds(timeLimit?.centiSeconds ?? 0);
    setCumulativeRoundIds(timeLimit?.cumulativeRoundIds ?? []);
  };

  const handleOk = () => {
    if (hasUnsavedChanges()) {
      dispatch(updateTimeLimit(wcifRound.id, { centiSeconds, cumulativeRoundIds }));
    }
  };

  const Title = (
    <span>
      Time limit for
      {' '}
      {roundIdToString(wcifRound.id)}
    </span>
  );

  const Trigger = useMemo(() => {
    if (!timeLimit) {
      return '-';
    }

    const timeStr = centisecondsToClockFormat(timeLimit.centiseconds);

    let str;
    switch (timeLimit.cumulativeRoundIds.length) {
      case 0:
        str = timeStr;
        break;
      case 1:
        str = `${timeStr} cumulative`;
        break;
      default:
        str = `${timeStr} total for ${timeLimit.cumulativeRoundIds.join(', ')}`;
        break;
    }

    return <span>{str}</span>;
  }, [timeLimit]);

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
        Time Limit
      </div>
    </ButtonActivatedModal>
  );
}
