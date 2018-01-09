import React from 'react'

import events from 'wca/events.js.erb'
import formats from 'wca/formats.js.erb'
import AttemptResultInput from './AttemptResultInput'
import {
  pluralize,
  matchResult,
  roundIdToString,
  parseActivityCode,
  attemptResultToString,
} from './utils'

function roundCutoffToString(wcifRound, { short } = {}) {
  let cutoff = wcifRound.cutoff;
  if(!cutoff) {
    return "-";
  }

  let eventId = parseActivityCode(wcifRound.id).eventId;
  let matchStr = matchResult(cutoff.attemptResult, eventId, { short });
  if(short) {
    return `Best of ${cutoff.numberOfAttempts} ${matchStr}`;
  } else {
    let explanationText = `Competitors get ${pluralize(cutoff.numberOfAttempts, "attempt")} to get ${matchStr}.`;
    explanationText += ` If they succeed, they get to do all ${formats.byId[wcifRound.format].expectedSolveCount} solves.`;
    return explanationText;
  }
}

export default {
  Title({ wcifRound }) {
    return <span>Cutoff for {roundIdToString(wcifRound.id)}</span>;
  },
  Show({ value: cutoff, wcifEvent, wcifRound }) {
    return <span>{roundCutoffToString(wcifRound, { short: true })}</span>;
  },
  Input({ value: cutoff, onChange, autoFocus, wcifEvent, roundNumber }) {
    let wcifRound = wcifEvent.rounds[roundNumber - 1];
    let solveCount = formats.byId[wcifRound.format].expectedSolveCount;

    let numberOfAttemptsInput, attemptResultInput;
    let onChangeAggregator = () => {
      let numberOfAttempts = parseInt(numberOfAttemptsInput.value);
      let newCutoff;
      if(numberOfAttempts === 0) {
        newCutoff = null;
      } else {
        newCutoff = {
          numberOfAttempts,
          attemptResult: attemptResultInput ? parseInt(attemptResultInput.value) : 0,
        };
      }
      onChange(newCutoff);
    };

    let explanationText = cutoff ? roundCutoffToString(wcifRound) : null;
    return (
      <div>
        <div className="form-group">
          <label htmlFor="cutoff-round-format-input" className="col-sm-3 control-label">Cutoff format</label>
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
                {solveCount > 1 ? <option disabled="disabled">────────</option> : null}
                {solveCount > 1 && wcifRound.format !== 'a'  ? <option value={1}>Best of 1</option> : null}
                {solveCount > 2 ? <option value={2}>Best of 2</option> : null}
                {solveCount > 3 && wcifRound.format !== 'a' ? <option value={3}>Best of 3</option> : null}
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

        {explanationText}
      </div>
    );
  },
};
