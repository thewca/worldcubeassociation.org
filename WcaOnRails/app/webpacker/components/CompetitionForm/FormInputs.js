/* eslint-disable jsx-a11y/control-has-associated-label */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable react/no-danger */
import React, {
  useCallback, useEffect, useRef, useState,
} from 'react';

import {
  Checkbox,
  Form,
  Input,
  Select,
  TextArea,
} from 'semantic-ui-react';
import Loading from '../Requests/Loading';
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

export function InputTextArea({ inputState, ...props }) {
  return (
    <FieldWrapper inputState={inputState} {...props}>
      <TextArea value={inputState.value} onChange={inputState.onChange} />
    </FieldWrapper>
  );
}

export function InputNumber({ inputState, ...props }) {
  return (
    <FieldWrapper inputState={inputState} {...props}>
      <Input type="number" value={inputState.value} onChange={inputState.onChange} />
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

export function InputBoolean({ inputState }) {
  const label = getInputStateLabel(inputState);
  const onChange = (e, { checked }) => {
    inputState.onChange(checked);
  };

  return (
    <Form.Field>
      <Checkbox checked={inputState.value} onChange={onChange} label={label} />
    </Form.Field>
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

export function UserSearch({ inputState, delegateOnly = false, traineeOnly = false }) {
  let classNames = 'form-control user_ids optional wca-autocomplete wca-autocomplete-users_search';
  if (delegateOnly) classNames += ' wca-autocomplete-only_staff_delegates';
  if (traineeOnly) classNames += ' wca-autocomplete-only_trainee_delegates';

  const [initialData, setInitialData] = useState(inputState.value ? null : '[]');

  useEffect(() => {
    if (!inputState.value) return;
    // const ids = inputState.value.split(',');
    // const promises = ids.map((id) => fetchJsonOrError(userApiUrl(id)));
    // Promise.all(promises).then((users) => {
    //   setInitialData(JSON.stringify(users));
    // });
    setInitialData('[]');
  }, []);

  // This is a workaround for selectize and jquery not calling onChange
  const inputRef = useRef(null);
  const refWrapper = useCallback((node) => {
    inputRef.current = node;
    if (!inputRef.current) return;
    $(`#${inputState.attribute}`).on('change', (e) => {
      inputState.onChange(e.target.value);
    });
  }, []);

  return (
    <FieldWrapper inputState={inputState}>
      {initialData
        ? (
          <input
            ref={refWrapper}
            defaultValue={inputState.value}
            className={classNames}
            type="text"
            data-data={initialData}
            id={inputState.attribute}
          />
        ) : <Loading />}
    </FieldWrapper>
  );
}
