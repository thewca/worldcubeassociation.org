import _ from 'lodash';
import React, { useMemo, useState } from 'react';
import { Checkbox, Form, Popup } from 'semantic-ui-react';
import { events } from '../../../../lib/wca-data.js.erb';
import { useStore } from '../../../../lib/providers/StoreProvider';
import { parseActivityCode, roundIdToString } from '../../../../lib/utils/wcif';
import ButtonActivatedModal from '../ButtonActivatedModal';

export default function SelectRoundsModal({ timeLimit, excludeEventId, onOk }) {
  const { wcifEvents } = useStore();
  const [selectedRoundIds, setSelectedRoundIds] = useState(timeLimit.cumulativeRoundIds);

  const Title = useMemo(() => (
    <span>
      Choose rounds for cumulative time limit
    </span>
  ), []);

  const Trigger = useMemo(() => (
    <span>
      Share with other rounds
    </span>
  ), []);

  const handleOk = () => onOk(selectedRoundIds);

  const reset = () => {
    setSelectedRoundIds(timeLimit?.cumulativeRoundId ?? []);
  };

  const hasUnsavedChanges = () => !_.isEqual(selectedRoundIds, timeLimit.cumulativeRoundIds);

  const wcifRounds = _.compact(_.flatMap(wcifEvents, (wcifEvent) => {
    // Cross round cumulative time limits may not include other rounds of
    // the same event.
    // See https://github.com/thewca/wca-regulations/issues/457.
    const otherEvent = events.byId[wcifEvent.id];
    if (!otherEvent.canChangeTimeLimit || excludeEventId === wcifEvent.id) {
      return [];
    }
    return wcifEvent.rounds;
  }));

  const handleChecked = (_ev, data) => {
    if (data.disabled) {
      return;
    }

    if (data.checked) {
      setSelectedRoundIds([...selectedRoundIds, data.value]);
    } else {
      setSelectedRoundIds(selectedRoundIds.filter((roundId) => roundId !== data.value));
    }
  };

  return (
    <ButtonActivatedModal
      title={Title}
      trigger={Trigger}
      hasUnsavedChanges={hasUnsavedChanges()}
      onOk={handleOk}
      reset={reset}
    >
      {wcifRounds.map((wcifRound) => {
        const roundId = wcifRound.id;
        const { eventId } = parseActivityCode(roundId);
        const event = events.byId[eventId];
        const checked = selectedRoundIds.indexOf(roundId) > -1;

        const eventAlreadySelected = !!selectedRoundIds.find((selectedRoundId) => (
          parseActivityCode(selectedRoundId).eventId === eventId
        ));

        const disabled = !checked && eventAlreadySelected;
        const disabledReason = disabled ? `Cannot select this round because you've already selected a round with ${event.name}` : null;

        return (
          <Form.Field key={roundId}>
            <Popup
              content={disabledReason}
              disabled={!disabled}
              position="right center"
              trigger={(
                <Checkbox
                  name="round-id-radio-group"
                  label={roundIdToString(roundId)}
                  value={roundId}
                  checked={checked}
                  onClick={handleChecked}
                  disabled={disabled}
                />
              )}
            />
          </Form.Field>
        );
      })}
    </ButtonActivatedModal>
  );
}
