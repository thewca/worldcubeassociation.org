import React, { useState, useCallback } from 'react';
import { Grid } from 'semantic-ui-react';
import { DNF_KEYS, DNS_KEYS } from './keybindings';
import TimeField from './TimeField';
import CubesField from './CubesField';
import {
  decodeMbldAttemptResult,
  encodeMbldAttemptResult,
  DNF_VALUE,
  DNS_VALUE,
} from '../../../../lib/wca-live/attempts';

/* eslint react/jsx-props-no-spreading: "off" */
function MbldField({
  value, onChange, disabled, label, TextFieldProps = {},
}) {
  const [prevValue, setPrevValue] = useState(value);
  const [decodedDraftValue, setDecodedDraftValue] = useState(
    decodeMbldAttemptResult(value),
  );

  // Sync draft value when the upstream value changes.
  // See AttemptResultField for detailed description.
  if (prevValue !== value) {
    setDecodedDraftValue(decodeMbldAttemptResult(value));
    setPrevValue(value);
  }

  const handleDecodedValueChange = useCallback((draft) => {
    const updatedDecodedValue = draft;
    if (encodeMbldAttemptResult(updatedDecodedValue) !== value) {
      onChange(encodeMbldAttemptResult(updatedDecodedValue));
      // Once we emit the change, reflect the initial state.
      setDecodedDraftValue(decodeMbldAttemptResult(value));
    } else {
      setDecodedDraftValue(updatedDecodedValue);
    }
  }, [onChange, value, setDecodedDraftValue]);

  const handleAnyInput = useCallback((event) => {
    const key = event.nativeEvent.data;
    if (DNF_KEYS.includes(key)) {
      handleDecodedValueChange(decodeMbldAttemptResult(DNF_VALUE));
      event.preventDefault();
    } else if (DNS_KEYS.includes(key)) {
      handleDecodedValueChange(decodeMbldAttemptResult(DNS_VALUE));
      event.preventDefault();
    }
  }, [handleDecodedValueChange]);

  return (
    <Grid onInputCapture={handleAnyInput}>
      <Grid.Column width={3}>
        <CubesField
          label="Solved"
          value={decodedDraftValue.solved}
          onChange={(solved) => handleDecodedValueChange({ ...decodedDraftValue, solved })}
          disabled={disabled}
          TextFieldProps={TextFieldProps}
        />
      </Grid.Column>
      <Grid.Column width={3}>
        <CubesField
          label="Attempted"
          value={decodedDraftValue.attempted}
          onChange={(attempted) => handleDecodedValueChange({ ...decodedDraftValue, attempted })}
          disabled={disabled}
          TextFieldProps={TextFieldProps}
        />
      </Grid.Column>
      <Grid.Column width={10}>
        <TimeField
          label={label}
          value={decodedDraftValue.centiseconds}
          onChange={
            (centiseconds) => handleDecodedValueChange({ ...decodedDraftValue, centiseconds })
          }
          disabled={disabled}
          TextFieldProps={TextFieldProps}
        />
      </Grid.Column>
    </Grid>
  );
}

export default MbldField;
