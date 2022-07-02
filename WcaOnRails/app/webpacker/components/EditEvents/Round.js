import React from 'react';

import events from '../../lib/wca-data/events.js.erb';
import formats from '../../lib/wca-data/formats.js.erb';
import { roundIdToString } from '../../lib/utils/wcif';

import {
  EditAdvancementConditionModal, EditTimeLimitModal, EditCutoffModal,
} from './Modals';
import { useDispatch } from '../../lib/providers/StoreProvider';
import { useConfirm } from '../../lib/providers/ConfirmProvider';
import { setRoundFormat, setScrambleSetCount } from './store/actions';

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
    <tr className={`round-${roundNumber}`}>
      <td>{roundNumber}</td>
      <td>
        <select
          name="format"
          className="form-control input-xs"
          value={wcifRound.format}
          onChange={roundFormatChanged}
          disabled={disabled}
        >
          {event.formats().map((format) => (
            <option key={format.id} value={format.id}>
              {format.shortName}
            </option>
          ))}
        </select>
      </td>

      <td className="text-center">
        <input
          name="scrambleSetCount"
          className="form-control input-xs"
          type="number"
          min={1}
          value={wcifRound.scrambleSetCount}
          onChange={scrambleSetCountChanged}
          disabled={disabled}
        />
      </td>

      {event.canChangeTimeLimit && (
        <td className="text-center">
          <EditTimeLimitModal
            wcifEvent={wcifEvent}
            roundNumber={roundNumber}
            disabled={disabled}
          />
        </td>
      )}

      {event.canHaveCutoff && (
        <td className="text-center">
          <EditCutoffModal
            wcifEvent={wcifEvent}
            wcifRound={wcifRound}
            roundNumber={roundNumber}
            disabled={disabled}
          />
        </td>
      )}

      <td className="text-center">
        {!isLastRound && (
          <EditAdvancementConditionModal
            wcifEvent={wcifEvent}
            roundNumber={roundNumber}
            disabled={disabled}
          />
        )}
      </td>
    </tr>
  );
}
