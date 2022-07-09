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
import { setRoundFormat, setScrambleSetCount } from '../store/actions';

export default function Round({
  index, wcifRound, wcifEvent, disabled,
}) {
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const event = events.byId[wcifEvent.id];

  const roundNumber = index + 1;
  const isLastRound = roundNumber === wcifEvent.rounds.length;

  const roundFormatChanged = (e) => {
    const newFormat = e.target.value;

    if (
      wcifRound.cutoff
      && !formats.byId[newFormat].allowedFirstPhaseFormats.includes(
        wcifRound.cutoff.numberOfAttempts.toString(),
      )
    ) {
      // if the format is changing to a format that doesn't have a cutoff
      confirm({
        content: `Are you sure you want to change the format of ${
          roundIdToString(wcifRound.id)
        }? This will clear the cutoff`,
      })
        .then(() => {
          dispatch(setRoundFormat(wcifRound, newFormat));
          // wcifRound.format = newFormat;
          // wcifRound.cutoff = null;
        });
    } else {
      // if the format is changing to a format that has a cutoff
      dispatch(setRoundFormat(wcifRound, newFormat));
      // wcifRound.format = newFormat;
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
            roundNumber={roundNumber}
            disabled={disabled}
          />
        )}
      </Table.Cell>
    </Table.Row>
  );
}
