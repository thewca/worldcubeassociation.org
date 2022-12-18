import React from 'react'

import { events, formats } from '../../lib/wca-data.js.erb'
import AttemptResultInput from './AttemptResultInput'
import {
  pluralize,
  matchResult,
  attemptResultToString,
} from '../../lib/utils/edit-events'
import {
  roundIdToString,
  parseActivityCode,
} from '../../lib/utils/wcif'

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
    let cutoffFormats = formats.byId[wcifRound.format].allowedFirstPhaseFormats;

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
                {cutoffFormats.length > 0 && (<option disabled="disabled">────────</option>)}
                {cutoffFormats.map((format, index) =>
                  <option key={index} value={+format}>Best of {format}</option>
                )}
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
