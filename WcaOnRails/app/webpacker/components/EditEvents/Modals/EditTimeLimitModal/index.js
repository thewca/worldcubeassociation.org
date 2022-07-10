import React, { useMemo, useState } from 'react';
import _ from 'lodash';
import { Button, Form, Radio } from 'semantic-ui-react';
import events from '../../../../lib/wca-data/events.js.erb';
import { roundIdToString } from '../../../../lib/utils/wcif';
import { centisecondsToClockFormat } from '../../../../lib/wca-live/attempts';
import { useDispatch } from '../../../../lib/providers/StoreProvider';
import TimeField from '../../../Results/WCALive/AttemptResultField/TimeField';
import { updateTimeLimit } from '../../store/actions';
import ButtonActivatedModal from '../ButtonActivatedModal';
import TimeLimitDecscription from './TimeLimitDescription';
import SelectRoundsModal from './SelectRoundsModal';

/**
 * Shows a modal to edit the timelimit of a round.
 * @param {Event} wcifEvent
 * @param {Round} wcifRound
 * @returns {React.ReactElement}
 */
export default function EditTimeLimitModal({ wcifEvent, wcifRound, disabled }) {
  const { timeLimit } = wcifRound;
  const dispatch = useDispatch();
  const event = events.byId[wcifEvent.id];

  const [centiseconds, setCentiseconds] = useState(timeLimit?.centiseconds ?? 0);
  const [cumulativeRoundIds, setCumulativeRoundIds] = useState(timeLimit?.cumulativeRoundIds ?? []);

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

  const Title = useMemo(() => (
    <span>
      Time limit for
      {' '}
      {roundIdToString(wcifRound.id)}
    </span>
  ), [wcifRound.id]);

  if (!event.canChangeTimeLimit) {
    return null;
  }

  const hasUnsavedChanges = () => (
    !_.isEqual(timeLimit, { centiseconds, cumulativeRoundIds })
  );

  const reset = () => {
    setCentiseconds(timeLimit?.centiSeconds ?? 0);
    setCumulativeRoundIds(timeLimit?.cumulativeRoundIds ?? []);
  };

  const handleOk = () => {
    if (hasUnsavedChanges()) {
      dispatch(updateTimeLimit(wcifRound.id, { centiseconds, cumulativeRoundIds }));
    }
    return true;
  };

  const handleCumulativeRoundsChange = (value) => {
    setCumulativeRoundIds(value);
    return true;
  };

  return (
    <ButtonActivatedModal
      trigger={Trigger}
      title={Title}
      onOk={handleOk}
      reset={reset}
      hasUnsavedChanges={hasUnsavedChanges()}
      disabled={disabled}
      closeOnDocumentClick={false}
      closeOnDimmerClick={false}
    >
      <TimeField
        label="Time Limit"
        value={centiseconds}
        onChange={setCentiseconds}
        disabled={disabled}
      />
      <br />
      <Form.Field inline>
        <Radio
          label="per-solve"
          name="timeLimitType"
          value="per-solve"
          checked={cumulativeRoundIds.length === 0}
          onChange={() => setCumulativeRoundIds([])}
        />
        <Radio
          label="cumulative"
          name="timeLimitType"
          value="per-solve"
          checked={cumulativeRoundIds.length > 0}
          onChange={() => setCumulativeRoundIds([wcifRound.id])}
        />
      </Form.Field>
      <TimeLimitDecscription
        wcifRound={wcifRound}
        timeLimit={{ centiseconds, cumulativeRoundIds }}
        onOk={handleCumulativeRoundsChange}
      />
    </ButtonActivatedModal>
  );
}
