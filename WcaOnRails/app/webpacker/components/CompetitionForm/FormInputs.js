import React, {
  useCallback, useContext, useEffect, useRef, useState,
} from 'react';
import {
  Checkbox,
  Form,
  Input,
  Radio,
  Select,
} from 'semantic-ui-react';
import AutoNumeric from 'autonumeric';
import TextareaAutosize from 'react-autosize-textarea';
import Loading from '../Requests/Loading';
import useInputState from '../../lib/hooks/useInputState';
import I18n from '../../lib/i18n';
import MarkdownEditor from './MarkdownEditor';
import { currenciesData } from '../../lib/wca-data.js.erb';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import { competitionApiUrl, userApiUrl } from '../../lib/requests/routes.js.erb';
import FormContext from './FormContext';

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
  const inputLabel = (label === undefined && getInputStateLabel(inputState)) || label;
  const inputHint = (hint === undefined && getInputStateHint(inputState)) || hint;

  return (
    <Form.Field>
      {/* eslint-disable-next-line react/no-danger, jsx-a11y/label-has-associated-control */}
      <label dangerouslySetInnerHTML={{ __html: inputLabel }} />
      {children}
      {/* eslint-disable-next-line react/no-danger */}
      <p dangerouslySetInnerHTML={{ __html: inputHint }} className="help-block" />
    </Form.Field>
  );
}

export function InputString({
  inputState,
  attachedLabel,
  label,
  hint,
}) {
  const { disabled } = useContext(FormContext);

  return (
    <FieldWrapper inputState={inputState} label={label} hint={hint}>
      <Input
        label={attachedLabel}
        value={inputState.value}
        onChange={inputState.onChange}
        disabled={disabled}
      />
    </FieldWrapper>
  );
}

export function InputTextArea({ inputState }) {
  const { disabled } = useContext(FormContext);

  return (
    <FieldWrapper inputState={inputState}>
      <TextareaAutosize
        value={inputState.value}
        onChange={(e) => {
          inputState.onChange(e.target.value);
        }}
        className="no-autosize"
        rows={2}
        disabled={disabled}
      />
    </FieldWrapper>
  );
}

export function InputNumber({ inputState }) {
  const { disabled } = useContext(FormContext);

  return (
    <FieldWrapper inputState={inputState}>
      <Input type="number" value={inputState.value} onChange={inputState.onChange} disabled={disabled} />
    </FieldWrapper>
  );
}

export function InputCurrency({ inputState, currency }) {
  const [autoNumeric, setAutoNumeric] = useState();
  const { disabled } = useContext(FormContext);

  const inputComponentRef = useRef();

  const currencyInfo = currenciesData.byIso[currency] || currenciesData.byIso.USD;

  useEffect(() => {
    const newAutoNumeric = new AutoNumeric(inputComponentRef.current.inputRef.current, {
      currencySymbol: currencyInfo.symbol,
      currencySymbolPlacement: currencyInfo.symbolFirst ? 'p' : 's',
      decimalPlaces: (currencyInfo.subunitToUnit === 1) ? 0 : 2,
      showWarnings: false,
      modifyValueOnWheel: false,
    }).set(inputState.value / currencyInfo.subunitToUnit);
    setAutoNumeric(newAutoNumeric);
  }, []);

  useEffect(() => {
    if (!autoNumeric) return;
    autoNumeric.update({
      currencySymbol: currencyInfo.symbol,
      currencySymbolPlacement: currencyInfo.symbolFirst ? 'p' : 's',
      decimalPlaces: (currencyInfo.subunitToUnit === 1) ? 0 : 2,
    });
  }, [currency]);

  const onChange = () => {
    inputState.onChange(autoNumeric.rawValue * currencyInfo.subunitToUnit);
  };

  return (
    <FieldWrapper inputState={inputState}>
      <Input ref={inputComponentRef} type="text" onChange={onChange} disabled={disabled} />
    </FieldWrapper>
  );
}

export function InputSelect({ inputState, options }) {
  const { disabled } = useContext(FormContext);

  return (
    <FieldWrapper inputState={inputState}>
      <Select
        options={options}
        value={inputState.value}
        onChange={inputState.onChange}
        basic
        disabled={disabled}
      />
    </FieldWrapper>
  );
}

export function InputBooleanSelect({ inputState }) {
  const options = [
    {
      value: '',
      text: '',
    },
    {
      value: true,
      text: I18n.t(`simple_form.options.competition.${inputState.attribute}.true`),
    },
    {
      value: false,
      text: I18n.t(`simple_form.options.competition.${inputState.attribute}.false`),
    }];

  const { disabled } = useContext(FormContext);

  return (
    <FieldWrapper inputState={inputState}>
      <Select
        options={options}
        value={inputState.value}
        onChange={inputState.onChange}
        basic
        disabled={disabled}
      />
    </FieldWrapper>
  );
}

export function InputBoolean({ inputState, ignoreDisabled }) {
  const label = getInputStateLabel(inputState);
  const onChange = (e, { checked }) => {
    inputState.onChange(checked);
  };

  const { disabled } = useContext(FormContext);

  return (
    <Form.Field disabled={disabled && !ignoreDisabled}>
      <Checkbox checked={inputState.value} onChange={onChange} label={label} />
    </Form.Field>
  );
}

export function InputRadio({ inputState, options }) {
  const { disabled } = useContext(FormContext);

  return (
    <FieldWrapper inputState={inputState}>
      {options.map((option, idx) => (
        <React.Fragment key={option.value}>
          {idx !== 0 && <br />}
          <Radio
            label={option.text}
            checked={inputState.value === option.value}
            onChange={() => inputState.onChange(option.value)}
            disabled={disabled}
          />
        </React.Fragment>
      ))}
    </FieldWrapper>
  );
}

export function InputDate({ inputState, onChange }) {
  const { disabled } = useContext(FormContext);

  return (
    <FieldWrapper inputState={inputState}>
      <Input
        type="date"
        value={inputState.value}
        onChange={onChange || inputState.onChange}
        style={{ width: 'full' }}
        disabled={disabled}
      />
    </FieldWrapper>
  );
}

export function InputDateTime({ inputState }) {
  const { disabled } = useContext(FormContext);

  return (
    <FieldWrapper inputState={inputState}>
      <Input
        type="datetime-local"
        value={inputState.value}
        onChange={inputState.onChange}
        style={{ width: 'full' }}
        label="UTC"
        disabled={disabled}
      />
    </FieldWrapper>
  );
}

export function InputMarkdown({ inputState }) {
  const { disabled } = useContext(FormContext);

  return (
    <FieldWrapper inputState={inputState}>
      <MarkdownEditor value={inputState.value} onChange={inputState.onChange} disabled={disabled} />
    </FieldWrapper>
  );
}

export function UserSearch({ inputState, delegateOnly = false, traineeOnly = false }) {
  let classNames = 'form-control user_ids optional wca-autocomplete wca-autocomplete-users_search';
  if (delegateOnly) classNames += ' wca-autocomplete-only_staff_delegates';
  if (traineeOnly) classNames += ' wca-autocomplete-only_trainee_delegates';

  const [initialData, setInitialData] = useState(inputState.value ? null : '[]');
  const { disabled } = useContext(FormContext);

  useEffect(() => {
    if (!inputState.value) return;

    const ids = inputState.value.split(',');
    const promises = ids.map((id) => fetchJsonOrError(userApiUrl(id)));

    Promise.all(promises).then((reqs) => {
      const users = reqs.map((req) => req.data.user);
      setInitialData(JSON.stringify(users));
    });
  }, []);

  // This is a workaround for selectize and jquery not calling onChange
  const refWrapper = useCallback(() => {
    $(`#${inputState.attribute}`).on('change', (e) => inputState.onChange(e.target.value));
    $(`#${inputState.attribute}`).wcaAutocomplete();
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
            disabled={disabled}
          />
        ) : <Loading />}
    </FieldWrapper>
  );
}

export function CompetitionSearch({
  inputState,
  lock,
  label,
  hint,
}) {
  let classNames = 'form-control competition_id optional wca-autocomplete wca-autocomplete-competitions_search';
  if (lock) classNames += ' wca-autocomplete-input_lock';

  const [initialData, setInitialData] = useState(inputState.value ? null : '[]');
  const { disabled } = useContext(FormContext);

  useEffect(() => {
    if (!inputState.value) return;

    const ids = inputState.value.split(',');
    const promises = ids.map((id) => fetchJsonOrError(competitionApiUrl(id)));

    Promise.all(promises).then((reqs) => {
      const comps = reqs.map((req) => req.data);
      setInitialData(JSON.stringify(comps));
    });
  }, []);

  const refWrapper = useCallback(() => {
    $(`#${inputState.attribute}`).on('change', (e) => inputState.onChange(e.target.value));
    $(`#${inputState.attribute}`).wcaAutocomplete();
  }, []);

  return (
    <FieldWrapper inputState={inputState} label={label} hint={hint}>
      {initialData
        ? (
          <input
            ref={refWrapper}
            defaultValue={inputState.value}
            className={classNames}
            type="text"
            data-data={initialData}
            id={inputState.attribute}
            disabled={disabled}
          />
        ) : <Loading />}
    </FieldWrapper>
  );
}
