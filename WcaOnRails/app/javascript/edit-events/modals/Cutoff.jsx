import React from 'react'

import events from 'wca/events.js.erb'
import formats from 'wca/formats.js.erb'
import AttemptResultInput from './AttemptResultInput'
import { attemptResultToString, roundIdToString, matchResult } from './utils'

export default {
  Title({ wcifRound }) {
    return <span>Cutoff for {roundIdToString(wcifRound.id)}</span>;
  },
  Show({ value: cutoff, wcifEvent }) {
    let str;
    if(cutoff) {
      str = `Best of ${cutoff.numberOfAttempts} ${matchResult(cutoff.attemptResult, wcifEvent.id, { short: true })}`;
    } else {
      str = "-";
    }
    return <span>{str}</span>;
  },
  Input({ value: cutoff, onChange, autoFocus, wcifEvent, roundNumber }) {
    let wcifRound = wcifEvent.rounds[roundNumber - 1];

    let numberOfAttemptsInput, attemptResultInput;
    let onChangeAggregator = () => {
      let numberOfAttempts = parseInt(numberOfAttemptsInput.value);
      let newCutoff;
      if(numberOfAttempts > 0) {
        newCutoff = {
          numberOfAttempts,
          attemptResult: attemptResultInput ? parseInt(attemptResultInput.value) : 0,
        };
      } else {
        newCutoff = null;
      }
      onChange(newCutoff);
    };

    return (
      <div>
        <div className="form-group">
          <label htmlFor="cutoff-round-format-input" className="col-sm-3 control-label">Round format</label>
          <div className="col-sm-9">
            <div className="input-group">
              <select value={cutoff ? cutoff.numberOfAttempts : 0}
                      autoFocus={autoFocus}
                      onChange={onChangeAggregator}
                      className="form-control"
                      id="cutoff-round-format-input"
                      ref={c => numberOfAttemptsInput = c}
              >
                <option value={0}>No cutoff</option>
                <option disabled="disabled">────────</option>
                <option value={1}>Best of 1</option>
                <option value={2}>Best of 2</option>
                <option value={3}>Best of 3</option>
              </select>
              <div className="input-group-addon">
                <strong>/ {formats.byId[wcifRound.format].name}</strong>
              </div>
            </div>
          </div>
        </div>
        {cutoff && (
          <div className="form-group">
            <label htmlFor="cutoff-input" className="col-sm-3 control-label">Cutoff</label>
            <div className="col-sm-9">
              <AttemptResultInput eventId={wcifEvent.id}
                                  id="cutoff-input"
                                  value={cutoff.attemptResult}
                                  onChange={onChangeAggregator}
                                  ref={c => attemptResultInput = c}
              />
            </div>
          </div>
        )}
      </div>
    );
  },
};
