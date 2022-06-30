import React from 'react';

import formats from '../../lib/wca-data/formats.js.erb';
import AttemptResultInput from './AttemptResultInput';
import { roundIdToString } from '../../lib/utils/wcif';
import { roundCutoffToString } from './utils';

export default {
  Title({ wcifRound }) {
    return (
      <span>
        Cutoff for
        {' '}
        {roundIdToString(wcifRound.id)}
      </span>
    );
  },
  Show({ wcifRound }) {
    return <span>{roundCutoffToString(wcifRound, { short: true })}</span>;
  },
  Input({
    value: cutoff, onChange, autoFocus, wcifEvent, roundNumber,
  }) {
    const wcifRound = wcifEvent.rounds[roundNumber - 1];
    const cutoffFormats = formats.byId[wcifRound.format].allowedFirstPhaseFormats;

    let numberOfAttemptsInput;
    let attemptResultInput;

    const onChangeAggregator = () => {
      const numberOfAttempts = parseInt(numberOfAttemptsInput.value, 10);
      let newCutoff;
      if (numberOfAttempts === 0) {
        newCutoff = null;
      } else {
        newCutoff = {
          numberOfAttempts,
          attemptResult: attemptResultInput ? parseInt(attemptResultInput.value, 10) : 0,
        };
      }
      onChange(newCutoff);
    };

    const explanationText = cutoff ? roundCutoffToString(wcifRound) : null;
    return (
      <div>
        <div className="form-group">
          <label htmlFor="cutoff-round-format-input" className="col-sm-3 control-label">Cutoff format</label>
          <div className="col-sm-9">
            <div className="input-group">
              <select
                value={cutoff ? cutoff.numberOfAttempts : 0}
                autoFocus={autoFocus}
                onChange={onChangeAggregator}
                className="form-control"
                id="cutoff-round-format-input"
                ref={(c) => {
                  numberOfAttemptsInput = c;
                }}
              >
                <option value={0}>No cutoff</option>
                {cutoffFormats.length > 0 && (<option disabled="disabled">────────</option>)}
                {cutoffFormats.map((format) => (
                  <option key={format} value={+format}>
                    Best of
                    {' '}
                    {format}
                  </option>
                ))}
              </select>
              <div className="input-group-addon">
                <strong>
                  /
                  {' '}
                  {formats.byId[wcifRound.format].name}
                </strong>
              </div>
            </div>
          </div>
        </div>
        {cutoff && (
          <div className="form-group">
            <label htmlFor="cutoff-input" className="col-sm-3 control-label">Cutoff</label>
            <div className="col-sm-9">
              <AttemptResultInput
                eventId={wcifEvent.id}
                id="cutoff-input"
                value={cutoff.attemptResult}
                onChange={onChangeAggregator}
                ref={(c) => {
                  attemptResultInput = c;
                }}
              />
            </div>
          </div>
        )}

        {explanationText}
      </div>
    );
  },
};
