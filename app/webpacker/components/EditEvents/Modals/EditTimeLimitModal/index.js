import React, {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import _ from 'lodash';
import { Form, Label } from 'semantic-ui-react';
import { events } from '../../../../lib/wca-data.js.erb';
import { roundIdToString } from '../../../../lib/utils/wcif';
import { centisecondsToClockFormat } from '../../../../lib/wca-live/attempts';
import { useDispatch } from '../../../../lib/providers/StoreProvider';
import TimeField from '../../../EditResult/WCALive/AttemptResultField/TimeField';
import { updateTimeLimit } from '../../store/actions';
import ButtonActivatedModal from '../ButtonActivatedModal';
import TimeLimitDescription from './TimeLimitDescription';

/**
 * Shows a modal to edit the time limit of a round.
 * @param {Event} wcifEvent
 * @param {Round} wcifRound
 * @returns {React.ReactElement}
 */
export default function EditTimeLimitModal({ wcifEvent, wcifRound, disabled }) {
  const { timeLimit } = wcifRound;
  const dispatch = useDispatch();
  const event = events.byId[wcifEvent.id];

  const linkedRoundIds = useMemo(() => wcifRound.linkedRounds ?? [], [wcifRound.linkedRounds]);

  const [centiseconds, setCentiseconds] = useState(timeLimit?.centiseconds ?? 0);
  const [cumulativeRoundIds, setCumulativeRoundIds] = useState(timeLimit?.cumulativeRoundIds ?? []);

  const isLinkedGroupCumulative = useMemo(
    () => _.isEqual(cumulativeRoundIds, linkedRoundIds),
    [cumulativeRoundIds, linkedRoundIds],
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

    return str;
  }, [timeLimit]);

  const Title = useMemo(() => `Time limit for ${roundIdToString(wcifRound.id)}`, [wcifRound.id]);

  const hasUnsavedChanges = () => (
    !_.isEqual(timeLimit, { centiseconds, cumulativeRoundIds })
  );

  const reset = useCallback(() => {
    setCentiseconds(timeLimit?.centiseconds ?? 0);
    setCumulativeRoundIds(timeLimit?.cumulativeRoundIds ?? []);
  }, [timeLimit?.centiseconds, timeLimit?.cumulativeRoundIds]);

  // if a different event updates cumulative time limits, these inputs need resetting
  useEffect(reset, [reset]);

  if (!event.canChangeTimeLimit) {
    return null;
  }

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
      triggerButtonProps={{ name: 'timeLimit' }}
    >
      <Label>
        Time Limit
      </Label>
      <TimeField
        value={centiseconds}
        onChange={setCentiseconds}
        disabled={disabled}
      />
      <Form.Group inline>
        <Form.Radio
          label="per-solve"
          name="timeLimitType"
          value="per-solve"
          checked={cumulativeRoundIds.length === 0}
          onChange={() => setCumulativeRoundIds([])}
        />
        <Form.Radio
          label="cumulative"
          name="timeLimitType"
          value="cross-events"
          checked={cumulativeRoundIds.length > 0 && !isLinkedGroupCumulative}
          onChange={() => setCumulativeRoundIds([wcifRound.id])}
        />
        {linkedRoundIds.length > 0 && (
          <Form.Radio
            label="Dual Rounds cumulative"
            name="timeLimitType"
            value="linked-round"
            checked={cumulativeRoundIds.length > 0 && isLinkedGroupCumulative}
            onChange={() => setCumulativeRoundIds(wcifRound.linkedRounds)}
          />
        )}
      </Form.Group>
      <TimeLimitDescription
        wcifRound={wcifRound}
        timeLimit={{ centiseconds, cumulativeRoundIds }}
        onOk={handleCumulativeRoundsChange}
      />
    </ButtonActivatedModal>
  );
}
