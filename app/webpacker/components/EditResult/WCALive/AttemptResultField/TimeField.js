import React, { useState, useCallback } from 'react';
import { Form } from 'semantic-ui-react';
import _ from 'lodash';
import { DNF_KEYS, DNS_KEYS } from './keybindings';
import {
  DNF_VALUE,
  SKIPPED_VALUE,
  DNS_VALUE,
  centisecondsToClockFormat,
} from '../../../../lib/wca-live/attempts';

function reformatInput(input) {
  const number = _.toInteger(input.replace(/\D/g, '')) || 0;
  if (number === 0) return '';
  const str = `00000000${number.toString().slice(0, 8)}`;
  const [, hh, mm, ss, cc] = str.match(/(\d\d)(\d\d)(\d\d)(\d\d)$/);
  return `${hh}:${mm}:${ss}.${cc}`.replace(/^[0:]*(?!\.)/g, '');
}

function inputToAttemptResult(input) {
  if (input === '') return SKIPPED_VALUE;
  if (input === 'DNF') return DNF_VALUE;
  if (input === 'DNS') return DNS_VALUE;
  const num = _.toInteger(input.replace(/\D/g, '')) || 0;
  return (
    Math.floor(num / 1000000) * 360000
    + Math.floor((num % 1000000) / 10000) * 6000
    + Math.floor((num % 10000) / 100) * 100
    + (num % 100)
  );
}

function attemptResultToInput(attemptResult) {
  if (attemptResult === SKIPPED_VALUE) return '';
  if (attemptResult === DNF_VALUE) return 'DNF';
  if (attemptResult === DNS_VALUE) return 'DNS';
  return centisecondsToClockFormat(attemptResult);
}

function isValid(input) {
  return input === attemptResultToInput(inputToAttemptResult(input));
}

/* eslint react/jsx-props-no-spreading: "off" */
function TimeField({
  value, onChange, label, disabled, TextFieldProps = {},
}) {
  const [prevValue, setPrevValue] = useState(value);
  const [draftInput, setDraftInput] = useState(attemptResultToInput(value));

  // Sync draft value when the upstream value changes.
  // See AttemptResultField for detailed description.
  if (prevValue !== value) {
    setDraftInput(attemptResultToInput(value));
    setPrevValue(value);
  }

  const handleChange = useCallback((event) => {
    const key = event.nativeEvent.data;
    if (DNF_KEYS.includes(key)) {
      setDraftInput('DNF');
    } else if (DNS_KEYS.includes(key)) {
      setDraftInput('DNS');
    } else {
      setDraftInput(reformatInput(event.target.value));
    }
  }, [setDraftInput]);

  const handleBlur = useCallback(() => {
    const attempt = isValid(draftInput)
      ? inputToAttemptResult(draftInput)
      : SKIPPED_VALUE;
    onChange(attempt);
    // Once we emit the change, reflect the initial state.
    setDraftInput(attemptResultToInput(value));
  }, [draftInput, onChange, setDraftInput, value]);

  return (
    <Form.Input
      {...TextFieldProps}
      label={label}
      disabled={disabled}
      spellCheck={false}
      value={draftInput}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
}

export default TimeField;
