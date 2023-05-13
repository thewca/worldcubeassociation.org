import React, { useState, useCallback } from 'react';
import { Form } from 'semantic-ui-react';
import _ from 'lodash';
import { SKIPPED_VALUE } from '../../../../lib/wca-live/attempts';
import {
  attemptResultToMbPoints,
  mbPointsToAttemptResultWithUnknownTime
} from '../../../../lib/utils/edit-events';

function numberToInput(number) {
  if (number === SKIPPED_VALUE) return '';
  return number.toString();
}

/* eslint react/jsx-props-no-spreading: "off" */
function MbldPointsField({
  value: rawValue, onChange, label, disabled, TextFieldProps = {},
}) {
  const value = attemptResultToMbPoints(rawValue);
  const [prevValue, setPrevValue] = useState(value);
  const [draftValue, setDraftValue] = useState(value);

  // Sync draft value when the upstream value changes.
  // See AttemptResultField for detailed description.
  if (prevValue !== value) {
    setDraftValue(value);
    setPrevValue(value);
  }

  const handleChange = useCallback((event) => {
    const newValue = _.toInteger(event.target.value.replace(/\D/g, '')) || SKIPPED_VALUE;
    setDraftValue(newValue);
  }, [setDraftValue]);

  const handleBlur = useCallback(() => {
    const parsedDraftValue = mbPointsToAttemptResultWithUnknownTime(draftValue);
    onChange(parsedDraftValue);
    // Once we emit the change, reflect the initial state.
    setDraftValue(value);
  }, [onChange, draftValue, setDraftValue, value]);

  return (
    <Form.Input
      {...TextFieldProps}
      label={label}
      disabled={disabled}
      spellCheck={false}
      value={numberToInput(draftValue)}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
}

export default MbldPointsField;
