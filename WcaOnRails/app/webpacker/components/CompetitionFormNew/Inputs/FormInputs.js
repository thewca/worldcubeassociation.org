import React, { useCallback, useContext, useMemo } from 'react';
import {
  Checkbox,
  Form,
  Input, Radio,
  Select,
} from 'semantic-ui-react';
import TextareaAutosize from 'react-autosize-textarea';
import I18n from '../../../lib/i18n';
import FormContext from '../State/FormContext';
import MarkdownEditor from './MarkdownEditor';
import { UserSearch } from './WCASearch';
import AutonumericField from './AutonumericField';

function getFieldLabel(id) {
  return I18n.t(`activerecord.attributes.competition.${id}`);
}

function getFieldHint(id, md) {
  // TODO: Maybe this should be forced within the translation file?
  if (md) {
    const snakeCaseId = id.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    return I18n.t(`competitions.competition_form.${snakeCaseId}_html`, {
      md: I18n.t('competitions.competition_form.supports_md_html'),
    });
  }
  return I18n.t(`simple_form.hints.competition.${id}`);
}

function FieldWrapper({
  id,
  label,
  noLabel,
  hint,
  noHint,
  mdHint,
  children,
}) {
  const htmlLabel = noLabel ? '&#8203;' : label || getFieldLabel(id);
  const htmlHint = noHint ? '&#8203;' : hint || getFieldHint(id, mdHint);

  return (
    <Form.Field>
      {/* eslint-disable-next-line react/no-danger, jsx-a11y/label-has-associated-control */}
      <label dangerouslySetInnerHTML={{ __html: htmlLabel }} />
      {children}
      {/* eslint-disable-next-line react/no-danger */}
      <p dangerouslySetInnerHTML={{ __html: htmlHint }} className="help-block" />
    </Form.Field>
  );
}

const wrapInput = (
  WrappedInput,
  additionalPropNames,
  emptyStringForNull = false,
) => function wrappedInput(props) {
  const { formData, setFormData } = useContext(FormContext);

  const inputProps = additionalPropNames.reduce((acc, propName) => {
    acc[propName] = props[propName];
    return acc;
  }, {});

  const onChange = useCallback((e, { value: newValue }) => {
    setFormData((previousData) => ({ ...previousData, [props.id]: newValue }));
  }, [props.id, setFormData]);
  let value = formData[props.id];

  if (emptyStringForNull && value === null) value = '';

  /* eslint-disable react/jsx-props-no-spreading */
  return (
    <FieldWrapper
      id={props.id}
      label={props.label}
      noLabel={props.noLabel}
      hint={props.hint}
      noHint={props.noHint}
      mdHint={props.mdHint}
    >
      <WrappedInput
        {...inputProps}
        value={value}
        onChange={onChange}
      />
    </FieldWrapper>
  );
  /* eslint-enable react/jsx-props-no-spreading */
};

export const InputString = wrapInput((props) => (
  <Input label={props.attachedLabel} value={props.value} onChange={props.onChange} />
), ['attachedLabel'], true);

export const InputTextArea = wrapInput((props) => (
  <TextareaAutosize
    value={props.value}
    onChange={(e) => props.onChange(e, { value: e.target.value })}
    className="no-autosize"
    rows={2}
  />
), [], true);

export const InputNumber = wrapInput((props) => (
  <Input
    type="number"
    value={props.value}
    onChange={props.onChange}
    min={props.min}
    max={props.max}
  />
), ['min', 'max'], true);

export const InputDate = wrapInput((props) => {
  const date = props.value && new Date(props.value);

  const onChange = useCallback((e, { value: newValue }) => {
    if (!newValue || !props.dateTime) {
      props.onChange(e, { value: newValue });
      return;
    }

    const newDate = new Date(newValue);
    newDate.getTimezoneOffset();
    newDate.setMinutes(newDate.getMinutes() - newDate.getTimezoneOffset());
    props.onChange(e, { value: newDate.toISOString() });
  }, [props.onChange, props.dateTime]);

  return (
    <Input
      type={props.dateTime ? 'datetime-local' : 'date'}
      value={date && date.toISOString().slice(0, props.dateTime ? 16 : 10)}
      onChange={onChange}
      style={{ width: 'full' }}
      label={props.dateTime ? 'UTC' : null}
    />
  );
}, ['dateTime'], true);

export const InputSelect = wrapInput((props) => (
  <Select
    options={props.options}
    value={props.value}
    onChange={props.onChange}
    search={props.search}
  />
), ['options', 'search']);

export const InputRadio = wrapInput((props) => (
  <>
    {props.options.map((option, idx) => (
      <React.Fragment key={option.value}>
        {idx !== 0 && <br />}
        <Radio
          label={option.text}
          checked={props.value === option.value}
          onChange={() => props.onChange(null, { value: option.value })}
        />
      </React.Fragment>
    ))}
  </>
), ['options']);

export const InputMarkdown = wrapInput((props) => (
  <MarkdownEditor value={props.value} onChange={props.onChange} />
), [], true);

export const InputUsers = wrapInput((props) => (
  <UserSearch
    value={props.value}
    onChange={props.onChange}
    delegateOnly={props.delegateOnly}
    traineeOnly={props.traineeOnly}
  />
), ['delegateOnly', 'traineeOnly']);

export const InputCurrencyAmount = wrapInput((props) => (
  <AutonumericField currency={props.currency} value={props.value} onChange={props.onChange} />
), ['currency']);

export function InputBoolean({ id }) {
  const { formData, setFormData } = useContext(FormContext);

  const value = formData[id] || false;
  const onChange = useCallback((e, { checked: newValue }) => {
    setFormData((previousData) => ({ ...previousData, [id]: String(newValue) }));
  }, [id, setFormData]);
  const label = getFieldLabel(id);

  return (
    <Form.Field>
      <Checkbox checked={value} onChange={onChange} label={label} />
    </Form.Field>
  );
}

export function InputBooleanSelect({ id }) {
  const options = useMemo(() => [
    {
      value: null,
      text: '',
    },
    {
      value: true,
      text: I18n.t(`simple_form.options.competition.${id}.true`),
    },
    {
      value: false,
      text: I18n.t(`simple_form.options.competition.${id}.false`),
    }], [id]);

  return <InputSelect id={id} options={options} />;
}
