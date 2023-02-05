/* eslint-disable jsx-a11y/control-has-associated-label */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable react/no-danger */
import React, { useState, useCallback } from 'react';

import {
  Checkbox,
  Form,
  Input,
} from 'semantic-ui-react';
import I18n from '../../lib/i18n';

// Modified from '../../lib/hooks/useInputState';
const useInputState = (defaultVal = undefined) => {
  const [state, setState] = useState(defaultVal);
  const updateFromOnChange = useCallback((ev, data = undefined) => {
    if (data) {
      setState(data.value);
    } else {
      setState(ev);
    }
  }, [setState]);
  return [state, setState, updateFromOnChange];
};

export function useFormInputState(attribute, currentData, defaultVal = '') {
  const initialValue = currentData[attribute] || defaultVal;

  const [value, setValue, setValueFromChange] = useInputState(initialValue);
  return {
    attribute,
    value,
    setValue,
    onChange: setValueFromChange,
  };
}

// TODO: A better way of handling this is likely nessesary
export function getInputStateLabel(inputState) {
  if (!inputState) return null;
  const translation = I18n.t(`activerecord.attributes.competition.${inputState.attribute}`);
  if (translation) return translation;
  return inputState.attribute;
}

export function getInputStateHint(inputState) {
  if (!inputState) return null;
  return I18n.t(`simple_form.hints.competition.${inputState.attribute}`);
}

export function FieldWrapper({
  inputState,
  label,
  hint,
  children,
}) {
  const inputLabel = label || getInputStateLabel(inputState);
  const inputHint = hint || getInputStateHint(inputState);

  return (
    <Form.Field>
      <label dangerouslySetInnerHTML={{ __html: inputLabel }} />
      {children}
      <p dangerouslySetInnerHTML={{ __html: inputHint }} />
    </Form.Field>
  );
}

export function InputString({ inputState, attachedLabel, ...props }) {
  return (
    <FieldWrapper inputState={inputState} {...props}>
      <Input label={attachedLabel} value={inputState.value} onChange={inputState.onChange} />
    </FieldWrapper>
  );
}

export function InputSelect({ inputState, options, ...props }) {
  return (
    <FieldWrapper inputState={inputState} {...props}>
      <select value={inputState.value} onChange={inputState.onChange}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.text}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
}

export function InputBoolean({ inputState, ...props }) {
  // TODO: this needs to have a different way of handling the label
  return (
    <FieldWrapper inputState={inputState} {...props}>
      <Checkbox checked={inputState.value} onChange={inputState.onChange} />
    </FieldWrapper>
  );
}

export function InputDate({ inputState, ...props }) {
  return (
    <FieldWrapper inputState={inputState} {...props}>
      <Input type="date" value={inputState.value} onChange={inputState.onChange} style={{ width: 'full' }} />
    </FieldWrapper>
  );
}
