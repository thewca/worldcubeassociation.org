/* eslint-disable jsx-a11y/control-has-associated-label */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable react/no-danger */
import React from 'react';

import {
  Checkbox,
  Form,
  Input,
  Select,
} from 'semantic-ui-react';
import useInputState from '../../lib/hooks/useInputState';
import I18n from '../../lib/i18n';
import MarkdownEditor from './MarkdownEditor';

export function useFormInputState(attribute, currentData, defaultVal = '') {
  const initialValue = currentData[attribute] || defaultVal;

  const [value, setValueFromChange] = useInputState(initialValue);
  return {
    attribute,
    value,
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
      <p dangerouslySetInnerHTML={{ __html: inputHint }} className="help-block" />
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
      <Select options={options} value={inputState.value} onChange={inputState.onChange} basic />
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

export function InputDateTime({ inputState, ...props }) {
  return (
    <FieldWrapper inputState={inputState} {...props}>
      <Input type="datetime-local" value={inputState.value} onChange={inputState.onChange} style={{ width: 'full' }} />
    </FieldWrapper>
  );
}

export function InputMarkdown({ inputState }) {
  return (
    <FieldWrapper inputState={inputState}>
      <MarkdownEditor value={inputState.value} onChange={inputState.onChange} />
    </FieldWrapper>
  );
}
