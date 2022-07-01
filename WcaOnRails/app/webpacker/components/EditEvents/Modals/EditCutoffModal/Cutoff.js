import React, { useState } from 'react';

import { Form, Label } from 'semantic-ui-react';
import formats from '../../../../lib/wca-data/formats.js.erb';
import AttemptResultInput from '../../../AttemptResultInput';
import { roundIdToString } from '../../../../lib/utils/wcif';
import { roundCutoffToString } from '../../utils';
import CutoffFormatInput from './CutoffFormatInput';
import useInputState from '../../../../lib/hooks/useInputState';

export function Title({ wcifRound }) {
  return (
    <span>
      Cutoff for
      {' '}
      {roundIdToString(wcifRound.id)}
    </span>
  );
}

export function Show({ wcifRound }) {
  return (
    <span>
      {roundCutoffToString(wcifRound, { short: true })}
    </span>
  );
}

export function Input({
  value: cutoff, onChange, wcifEvent, roundNumber,
}) {
  // const cutoffFormatInputRef = createRef();
  const wcifRound = wcifEvent.rounds[roundNumber - 1];
  const cutoffFormats = formats.byId[wcifRound.format].allowedFirstPhaseFormats;
  const explanationText = cutoff ? roundCutoffToString(wcifRound) : null;

  const [numberOfAttempts, setNumberOfAttempts] = useInputState(cutoff.attemptResult);
  const [attemptResult, setAttemptResult] = useState(cutoff.attemptResult);

  const onAnyChange = () => {
    if (numberOfAttempts === 0) {
      onChange(null);
    } else {
      onChange({
        numberOfAttempts,
        attemptResult,
      });
    }
  };

  const handleAttemptResultChange = (value) => {
    setAttemptResult(value);
    onAnyChange();
  };

  const handleCutoffFormatChange = (ev, data) => {
    setNumberOfAttempts(ev, data);
    onAnyChange();
  };

  return (
    <div>
      <Form.Field>
        <Label basic className="col-sm-3 control-label">
          Cutoff format
        </Label>
        <CutoffFormatInput
          cutoffFormats={cutoffFormats}
          cutoff={cutoff ? cutoff.numberOfAttempts : 0}
          onChange={handleCutoffFormatChange}
        />
      </Form.Field>
      {cutoff && (
        <Form.Field>
          <Label htmlFor="cutoff-input" className="col-sm-3 control-Label">
            Cutoff
          </Label>
          <AttemptResultInput
            eventId={wcifEvent.id}
            id="cutoff-input"
            value={attemptResult}
            onChange={handleAttemptResultChange}
          />
        </Form.Field>
      )}

      {explanationText}
    </div>
  );
}
