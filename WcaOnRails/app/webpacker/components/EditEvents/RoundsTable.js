import React from 'react';

import events from '../../lib/wca-data/events.js.erb';
import formats from '../../lib/wca-data/formats.js.erb';
import rootRender from '../../lib/edit-events';
import I18n from '../../lib/i18n';
import {
  roundIdToString,
} from '../../lib/utils/wcif';
import {
  EditTimeLimitButton,
  EditCutoffButton,
  EditAdvancementConditionButton,
  EditQualificationButton,
} from './EditRoundAttribute';

export default function RoundsTable({ wcifEvents, wcifEvent, disabled }) {
  const event = events.byId[wcifEvent.id];

  return (
    <div className="table-responsive">
      <table className="table table-condensed">
        <thead>
          <tr>
            <th>#</th>
            <th className="text-center">Format</th>
            <th className="text-center">Scramble Sets</th>
            {event.canChangeTimeLimit && (
              <th className="text-center">Time Limit</th>
            )}
            {event.canHaveCutoff && <th className="text-center">Cutoff</th>}
            <th className="text-center">To Advance</th>
          </tr>
        </thead>
        <tbody>
          {wcifEvent.rounds.map((wcifRound, index) => {
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
                    <EditTimeLimitButton
                      wcifEvents={wcifEvents}
                      wcifEvent={wcifEvent}
                      roundNumber={roundNumber}
                      disabled={disabled}
                    />
                  </td>
                )}

                {event.canHaveCutoff && (
                  <td className="text-center">
                    <EditCutoffButton
                      wcifEvents={wcifEvents}
                      wcifEvent={wcifEvent}
                      roundNumber={roundNumber}
                      disabled={disabled}
                    />
                  </td>
                )}

                <td className="text-center">
                  {!isLastRound && (
                    <EditAdvancementConditionButton
                      wcifEvents={wcifEvents}
                      wcifEvent={wcifEvent}
                      roundNumber={roundNumber}
                      disabled={disabled}
                    />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <h5>
        {I18n.t('competitions.events.qualification')}
        :
        {' '}
        <EditQualificationButton wcifEvent={wcifEvent} disabled={disabled} />
      </h5>
    </div>
  );
}
