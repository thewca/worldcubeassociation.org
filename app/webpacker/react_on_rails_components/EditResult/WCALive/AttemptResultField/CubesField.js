import React, { useState, useCallback } from 'react';
import { Form } from 'semantic-ui-react';
import _ from 'lodash';

function numberToInput(number) {
  if (number === 0) return '';
  return number.toString();
}

/* eslint react/jsx-props-no-spreading: "off" */
function CubesField({
  value, onChange, label, disabled, TextFieldProps = {},
}) {
  const [prevValue, setPrevValue] = useState(value);
  const [draftValue, setDraftValue] = useState(value);

  // Sync draft value when the upstream value changes.
  // See AttemptResultField for detailed description.
  if (prevValue !== value) {
    setDraftValue(value);
    setPrevValue(value);
  }

  const handleChange = useCallback((event) => {
    const newValue = _.toInteger(event.target.value.replace(/\D/g, '')) || 0;
    if (newValue <= 99) {
      setDraftValue(newValue);
    }
  }, [setDraftValue]);

  const handleBlur = useCallback(() => {
    onChange(draftValue);
    // Once we emit the change, reflect the initial state.
    setDraftValue(value);
  }, [onChange, draftValue, setDraftValue, value]);

  return (
    <Form.Input
      {...TextFieldProps}
      fluid
      label={label}
      disabled={disabled}
      spellCheck={false}
      value={numberToInput(draftValue)}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
}

export default CubesField;
