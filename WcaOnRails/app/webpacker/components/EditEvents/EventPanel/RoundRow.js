import React from 'react';

import {
  Dropdown, Input, Table,
} from 'semantic-ui-react';
import { events, formats } from '../../../lib/wca-data.js.erb';
import { roundIdToString } from '../../../lib/utils/wcif';

import {
  EditAdvancementConditionModal, EditTimeLimitModal, EditCutoffModal,
} from '../Modals';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import { useConfirm } from '../../../lib/providers/ConfirmProvider';
import { updateRoundFormat, setScrambleSetCount, updateCutoff } from '../store/actions';

export default function RoundRow({
  index, wcifRound, wcifEvent, disabled,
}) {
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const event = events.byId[wcifEvent.id];

  const roundNumber = index + 1;
  const isLastRound = roundNumber === wcifEvent.rounds.length;

  const roundFormatChanged = (e, { value }) => {
    const newFormat = value;

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
      dispatch(updateRoundFormat(wcifRound.id, newFormat));
    }
  };

  const scrambleSetCountChanged = (e) => {
    dispatch(setScrambleSetCount(wcifRound.id, parseInt(e.target.value, 10))); // XXX
  };

  return (
    <Table.Row
      verticalAlign="middle"
      name={`round-${roundNumber}`}
    >
      <Table.Cell className="round-row__index">
        {wcifRound.id.split('-')[1].replace('r', '')}

      </Table.Cell>
      <Table.Cell className="round-row__format">
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
        />
      </Table.Cell>

      <Table.Cell className="round-row__scramble-set-count">
        <Input
          name="scrambleSetCount"
          type="number"
          min={1}
          value={wcifRound.scrambleSetCount}
          onChange={scrambleSetCountChanged}
          disabled={disabled}
        />
      </Table.Cell>

      {event.canChangeTimeLimit && (
        <Table.Cell className="round-row__time-limit">
          <EditTimeLimitModal
            wcifEvent={wcifEvent}
            wcifRound={wcifRound}
            roundNumber={roundNumber}
            disabled={disabled}
          />
        </Table.Cell>
      )}

      {event.canHaveCutoff && (
        <Table.Cell className="round-row__cutoff">
          <EditCutoffModal
            wcifEvent={wcifEvent}
            wcifRound={wcifRound}
            roundNumber={roundNumber}
            disabled={disabled}
          />
        </Table.Cell>
      )}

      <Table.Cell className="round-row_advancementCondition">
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
