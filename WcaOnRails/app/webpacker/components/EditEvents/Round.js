import React from 'react';

import formats from '../../lib/wca-data/formats.js.erb';
import rootRender from '../../lib/edit-events';
import {
  roundIdToString,
} from '../../lib/utils/wcif';

import {
  EditAdvancementConditionModal, EditTimeLimitModal, EditCutoffModal,
} from './Modals';

export default function Round({ index, wcifRound, wcifEvent }) {
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
      if (
        // eslint-disable-next-line no-restricted-globals
        confirm(
          `Are you sure you want to change the format of ${roundIdToString(
            wcifRound.id,
          )}? This will clear the cutoff.`,
        )
      ) {
        wcifRound.format = newFormat;
        wcifRound.cutoff = null;
      }
    } else {
      wcifRound.format = newFormat;
    }
    rootRender();
  };

  const scrambleSetCountChanged = (e) => {
    const newScrambleSetCount = parseInt(e.target.value, 10);
    wcifRound.scrambleSetCount = newScrambleSetCount;
    rootRender();
  };

  return (
    <tr key={roundNumber} className={`round-${roundNumber}`}>
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
