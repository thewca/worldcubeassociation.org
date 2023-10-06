import React, { useCallback, useMemo } from 'react';
import {
  Checkbox,
  Form,
  Input,
  Radio,
  Select,
} from 'semantic-ui-react';
import TextareaAutosize from 'react-autosize-textarea';
import I18n from '../../../lib/i18n';
import MarkdownEditor from './MarkdownEditor';
import { CompetitionSearch, UserSearch } from './WCASearch';
import AutonumericField from './AutonumericField';
import { useDispatch, useStore } from '../../../lib/providers/StoreProvider';
import { useCompetitionForm, useUpdateFormAction } from '../store/sections';

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
  blankLabel,
  hint,
  noHint,
  mdHint,
  error,
  children,
}) {
  const fallbackLabel = blankLabel ? '' : '&nbsp;';
  const htmlLabel = noLabel ? fallbackLabel : label || getFieldLabel(id);

  const htmlHint = noHint ? '&nbsp;' : hint || getFieldHint(id, mdHint);

  return (
    <Form.Field
      error={!!error}
      className={error && 'has-error'}
    >
      {/* eslint-disable-next-line react/no-danger, jsx-a11y/label-has-associated-control */}
      <label dangerouslySetInnerHTML={{ __html: htmlLabel }} />
      {children}
      {/* eslint-disable-next-line react/no-danger */}
      {error && (<p dangerouslySetInnerHTML={{ __html: error || '' }} className="help-block" />)}
      {/* eslint-disable-next-line react/no-danger */}
      <p dangerouslySetInnerHTML={{ __html: htmlHint }} className="help-block" />
    </Form.Field>
  );
}

const wrapInput = (
  WrappedInput,
  additionalPropNames,
  emptyStringForNull = false,
  inputValueKey = 'value',
) => function wrappedInput(props) {
  const { errors } = useStore();
  const dispatch = useDispatch();

  const formValues = useCompetitionForm();
  const updateFormValue = useUpdateFormAction();

  const inputProps = additionalPropNames.reduce((acc, propName) => {
    acc[propName] = props[propName];
    return acc;
  }, {});

  const onChange = useCallback((e, { [inputValueKey]: newValue }) => {
    dispatch(updateFormValue(props.id, newValue));
  }, [dispatch, updateFormValue, props.id]);

  let value = formValues[props.id];

  if (emptyStringForNull && value === null) value = '';

  inputProps[inputValueKey] = value;

  const error = errors && errors[props.id] && errors[props.id].length > 0 && errors[props.id].join(', ');

  const passDownLabel = additionalPropNames.includes('label');
  const noLabel = props.noLabel || passDownLabel;

  if (passDownLabel) inputProps.label = (props.label || getFieldLabel(props.id));

  /* eslint-disable react/jsx-props-no-spreading */
  return (
    <FieldWrapper
      id={props.id}
      label={props.label}
      noLabel={noLabel}
      blankLabel={passDownLabel}
      hint={props.hint}
      noHint={props.noHint}
      mdHint={props.mdHint}
      error={error}
    >
      <WrappedInput
        {...inputProps}
        onChange={onChange}
      />
    </FieldWrapper>
  );
  /* eslint-enable react/jsx-props-no-spreading */
};

export const InputString = wrapInput((props) => (
  <Input
    label={props.attachedLabel}
    value={props.value}
    onChange={props.onChange}
  />
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

export const InputCompetitions = wrapInput((props) => (
  <CompetitionSearch
    id={props.id}
    value={props.value}
    onChange={props.onChange}
    freeze={props.freeze}
  />
), ['id', 'freeze']);

export const InputCurrencyAmount = wrapInput((props) => (
  <AutonumericField currency={props.currency} value={props.value} onChange={props.onChange} />
), ['currency']);

export const InputBoolean = wrapInput((props) => (
  <Checkbox checked={props.checked} onChange={props.onChange} label={props.label} />
), ['label'], false, 'checked');

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
