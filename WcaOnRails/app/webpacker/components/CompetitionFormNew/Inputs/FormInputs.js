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

const wrapInput = (WrappedInput, additionalPropNames) => function wrappedInput(props) {
  const { formData, setFormData } = useContext(FormContext);

  const inputProps = additionalPropNames.reduce((acc, propName) => {
    acc[propName] = props[propName];
    return acc;
  }, {});

  const onChange = useCallback((e, { value: newValue }) => {
    setFormData((previousData) => ({ ...previousData, [props.id]: newValue }));
  }, [props.id, setFormData]);
  const value = formData[props.id] || '';

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
), ['attachedLabel']);

export const InputTextArea = wrapInput((props) => (
  <TextareaAutosize
    value={props.value}
    onChange={(e) => props.onChange(e, { value: e.target.value })}
    className="no-autosize"
    rows={2}
  />
), []);

export const InputNumber = wrapInput((props) => (
  <Input
    type="number"
    value={props.value}
    onChange={props.onChange}
    min={props.min}
    max={props.max}
  />
), ['min', 'max']);

export const InputDate = wrapInput((props) => (
  <Input
    type={props.dateTime ? 'datetime-local' : 'date'}
    value={props.value}
    onChange={props.onChange}
    style={{ width: 'full' }}
    label={props.dateTime ? 'UTC' : null}
  />
), ['dateTime']);

export const InputSelect = wrapInput((props) => (
  <Select options={props.options} value={props.value} onChange={props.onChange} />
), ['options']);

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
), []);

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

  const rawValue = formData[id];
  const value = rawValue === undefined ? false : String(rawValue) === 'true';
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
      value: '',
      text: '',
    },
    {
      value: 'true',
      text: I18n.t(`simple_form.options.competition.${id}.true`),
    },
    {
      value: 'false',
      text: I18n.t(`simple_form.options.competition.${id}.false`),
    }], [id]);

  return <InputSelect id={id} options={options} />;
}
