import React from 'react';

import {
  Dropdown, Input, Table,
} from 'semantic-ui-react';
import events from '../../../lib/wca-data/events.js.erb';
import formats from '../../../lib/wca-data/formats.js.erb';
import { roundIdToString } from '../../../lib/utils/wcif';

import {
  EditAdvancementConditionModal, EditTimeLimitModal, EditCutoffModal,
} from '../Modals';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import { useConfirm } from '../../../lib/providers/ConfirmProvider';
import { updateRoundFormat, setScrambleSetCount, updateCutoff } from '../store/actions';

console.log(17, formats);

export default function Round({
  index, wcifRound, wcifEvent, disabled,
}) {
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const event = events.byId[wcifEvent.id];

  const roundNumber = index + 1;
  const isLastRound = roundNumber === wcifEvent.rounds.length;

  const roundFormatChanged = (e, { value }) => {
    const newFormat = value;
    console.log(31, value);
    console.log(31, e, newFormat, wcifRound);

    if (
      wcifRound.cutoff
      && !formats.byId[newFormat].allowedFirstPhaseFormats.includes(
        wcifRound.cutoff.numberOfAttempts.toString(),
      )
    ) {
      // if the format is changing to a format that doesn't have a cutoff
      confirm({
        content: `Are you sure you want to change the format of ${roundIdToString(wcifRound.id)}? This will clear the cutoff`,
      })
        .then(() => {
          dispatch(updateRoundFormat(wcifRound.id, newFormat));
          dispatch(updateCutoff(wcifRound.id, null));
        });
    } else {
      // if the format is changing to a format that has a cutoff
      dispatch(updateRoundFormat(wcifRound, newFormat));
    }
  };

  const scrambleSetCountChanged = (e) => {
    dispatch(setScrambleSetCount(wcifRound.id, parseInt(e.target.value, 10))); // XXX
  };

  return (
    <Table.Row verticalAlign="middle">
      <Table.Cell>{wcifRound.id.split('-')[1].replace('r', '')}</Table.Cell>
      <Table.Cell>
        <Dropdown
          selection
          name="format"
          value={wcifRound.format}
          onChange={roundFormatChanged}
          disabled={disabled}
          options={event.formats().map((format) => ({
            key: format.id,
            value: format.id,
            text: format.shortName,
          }))}
          compact
          style={{
            fontSize: '1em',
          }}
        />
      </Table.Cell>

      <Table.Cell>
        <Input
          name="scrambleSetCount"
          type="number"
          min={1}
          value={wcifRound.scrambleSetCount}
          onChange={scrambleSetCountChanged}
          disabled={disabled}
          size="large"
          style={{
            width: '5em',
          }}
        />
      </Table.Cell>

      {event.canChangeTimeLimit && (
        <Table.Cell>
          <EditTimeLimitModal
            wcifEvent={wcifEvent}
            wcifRound={wcifRound}
            roundNumber={roundNumber}
            disabled={disabled}
          />
        </Table.Cell>
      )}

      {event.canHaveCutoff && (
        <Table.Cell>
          <EditCutoffModal
            wcifEvent={wcifEvent}
            wcifRound={wcifRound}
            roundNumber={roundNumber}
            disabled={disabled}
          />
        </Table.Cell>
      )}

      <Table.Cell>
        {!isLastRound && (
          <EditAdvancementConditionModal
            wcifEvent={wcifEvent}
            wcifRound={wcifRound}
            roundNumber={roundNumber}
            disabled={disabled}
          />
        )}
      </Table.Cell>
    </Table.Row>
  );
}
