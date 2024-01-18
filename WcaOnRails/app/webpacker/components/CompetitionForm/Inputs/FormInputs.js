import React, { useCallback, useMemo } from 'react';
import {
  Checkbox,
  Form,
  Input,
  Radio,
  Select,
} from 'semantic-ui-react';
import TextareaAutosize from 'react-textarea-autosize';
import { Circle } from 'react-leaflet';
import _ from 'lodash';
import I18n from '../../../lib/i18n';
import MarkdownEditor from './MarkdownEditor';
import { CompetitionSearch, UserSearch } from './FormSearch';
import AutonumericField from './AutonumericField';
import { useDispatch, useStore } from '../../../lib/providers/StoreProvider';
import {
  readValueRecursive,
  useCompetitionForm,
  useSections,
  useUpdateFormAction,
} from '../store/sections';
import { CompetitionsMap, DraggableMarker, StaticMarker } from './InputMap';
import { AddChampionshipButton, ChampionshipSelect } from './InputChampionship';

function snakifyId(id, section = []) {
  const idParts = [...section, id];
  const yamlParts = idParts.map(_.snakeCase);

  return yamlParts.join('.');
}

function getFieldLabel(id, section = []) {
  const yamlId = snakifyId(id, section);
  return I18n.t(`competitions.competition_form.labels.${yamlId}`);
}

function getFieldHint(id, section = [], isMarkdown = false) {
  const yamlId = snakifyId(id, section);

  // TODO: Maybe this should be forced within the translation file?
  if (isMarkdown) {
    return I18n.t(`competitions.competition_form.hints.${yamlId}_html`, {
      md: I18n.t('competitions.competition_form.supports_md_html'),
    });
  }

  return I18n.t(`competitions.competition_form.hints.${yamlId}`);
}

function getHtmlId(id, section = []) {
  return [...section, id].join('-');
}

function FieldWrapper({
  id,
  label,
  noLabel,
  hint,
  noHint,
  mdHint,
  error,
  disabled,
  required,
  children,
}) {
  const section = useSections();

  const blankLabel = noLabel === 'blank';
  const ignoreLabel = noLabel === 'ignore';

  const fallbackLabel = blankLabel ? '' : '&nbsp;';
  const htmlLabel = noLabel ? fallbackLabel : label || getFieldLabel(id, section);

  const blankHint = noHint === 'blank';

  const fallbackHint = blankHint ? '' : '&nbsp;';
  const htmlHint = noHint ? fallbackHint : hint || getFieldHint(id, section, mdHint);

  const htmlId = getHtmlId(id, section);

  return (
    <Form.Field
      error={!!error}
      className={(error && 'has-error') || ''}
      disabled={!!disabled}
      required={!!required}
    >
      {/* eslint-disable-next-line react/no-danger, jsx-a11y/label-has-associated-control */}
      {!ignoreLabel && <label htmlFor={htmlId} dangerouslySetInnerHTML={{ __html: htmlLabel }} />}
      {children}
      {/* eslint-disable-next-line react/no-danger */}
      {error && (<p dangerouslySetInnerHTML={{ __html: error || '' }} className="help-block" />)}
      {/* eslint-disable-next-line react/no-danger */}
      <p dangerouslySetInnerHTML={{ __html: htmlHint }} className="help-block" />
    </Form.Field>
  );
}

/* eslint-disable react/destructuring-assignment */
const wrapInput = (
  WrappedInput,
  additionalPropNames = [],
  nullDefault = undefined,
  inputValueKey = 'value',
) => function WcaFormInput(props) {
  const { isAdminView, errors, competition: { admin: { isConfirmed } } } = useStore();
  const dispatch = useDispatch();

  const section = useSections();

  const formValues = useCompetitionForm();
  const updateFormValue = useUpdateFormAction();

  const inputProps = additionalPropNames.reduce((acc, propName) => ({
    ...acc,
    [propName]: props[propName],
  }), {});

  const onChange = useCallback((e, { [inputValueKey]: newValue }) => {
    dispatch(updateFormValue(props.id, newValue));
  }, [dispatch, updateFormValue, props.id]);

  let value = formValues[props.id];

  // we want to provide "global default" for input components, as well as allow
  // individual inputs to override their local default value. So we check for defaults twice.
  if (value === null && props.defaultValue !== undefined) value = props.defaultValue;
  if (value === null && nullDefault !== undefined) value = nullDefault;

  inputProps[inputValueKey] = value;

  const errorSegment = readValueRecursive(errors, section);

  // sometimes we nest errors deeper than the fields, so we need to be cautious about joining
  const errorCandidates = errorSegment?.[props.id];
  const error = Array.isArray(errorCandidates) && errorCandidates.join(', ');

  const passDownLabel = additionalPropNames.includes('label');
  if (passDownLabel) inputProps.label = (props.label || getFieldLabel(props.id, section));

  const noLabel = passDownLabel ? 'ignore' : props.noLabel;

  const defaultDisabled = !props.alwaysEnabled && isConfirmed && !isAdminView;
  const disabled = defaultDisabled || props.disabled;

  const passDownDisabled = additionalPropNames.includes('disabled');
  if (passDownDisabled) inputProps.disabled = disabled;

  const htmlId = getHtmlId(props.id, section);
  const htmlName = getFieldLabel(props.id, section);

  /* eslint-disable react/jsx-props-no-spreading */
  return (
    <FieldWrapper
      id={props.id}
      label={props.label}
      noLabel={noLabel}
      hint={props.hint}
      noHint={props.noHint}
      mdHint={props.mdHint}
      error={error}
      disabled={disabled}
      required={props.required}
    >
      <WrappedInput
        {...inputProps}
        htmlId={htmlId}
        htmlName={htmlName}
        onChange={onChange}
      />
    </FieldWrapper>
  );
  /* eslint-enable react/jsx-props-no-spreading */
};
/* eslint-disable react/destructuring-assignment */

export const InputString = wrapInput((props) => (
  <Input
    id={props.htmlId}
    name={props.htmlName}
    label={props.attachedLabel}
    value={props.value}
    disabled={props.disabled}
    onChange={props.onChange}
  />
), ['attachedLabel', 'disabled'], '');

export const InputTextArea = wrapInput((props) => (
  <TextareaAutosize
    id={props.htmlId}
    name={props.htmlName}
    value={props.value}
    onChange={(e) => props.onChange(e, { value: e.target.value })}
    className="no-autosize"
    rows={2}
  />
), [], '');

export const InputNumber = wrapInput((props) => {
  const onChangeNumber = useCallback((e, { value: newValue }) => {
    const convertedNumber = Number(newValue);
    props.onChange(e, { value: convertedNumber });
  }, [props]);

  return (
    <Input
      id={props.htmlId}
      name={props.htmlName}
      type="number"
      label={props.attachedLabel}
      value={props.value}
      onChange={onChangeNumber}
      min={props.min}
      max={props.max}
      step={props.step}
    />
  );
}, ['attachedLabel', 'min', 'max', 'step']);

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
  }, [props]);

  return (
    <Input
      id={props.htmlId}
      name={props.htmlName}
      type={props.dateTime ? 'datetime-local' : 'date'}
      value={date && date.toISOString().slice(0, props.dateTime ? 16 : 10)}
      onChange={onChange}
      style={{ width: 'full' }}
      label={props.dateTime ? 'UTC' : null}
    />
  );
}, ['dateTime'], '');

export const InputSelect = wrapInput((props) => (
  <Select
    id={props.htmlId}
    name={props.htmlName}
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
          name={props.htmlName}
          label={option.text}
          value={option.value.toString()}
          checked={props.value === option.value}
          onChange={() => props.onChange(null, { value: option.value })}
        />
      </React.Fragment>
    ))}
  </>
), ['options']);

export const InputMarkdown = wrapInput((props) => (
  <MarkdownEditor
    id={props.htmlId}
    name={props.htmlName}
    value={props.value}
    onChange={props.onChange}
  />
), [], '');

export const InputUsers = wrapInput((props) => (
  <UserSearch
    id={props.htmlId}
    value={props.value}
    onChange={props.onChange}
    delegateOnly={props.delegateOnly}
    traineeOnly={props.traineeOnly}
  />
), ['delegateOnly', 'traineeOnly']);

export const InputCompetitions = wrapInput((props) => (
  <CompetitionSearch
    id={props.htmlId}
    value={props.value}
    onChange={props.onChange}
    disabled={props.disabled}
  />
), ['disabled']);

export const InputCurrencyAmount = wrapInput((props) => (
  <AutonumericField
    id={props.htmlId}
    currency={props.currency}
    value={props.value}
    onChange={props.onChange}
  />
), ['currency']);

export const InputBoolean = wrapInput((props) => (
  <Checkbox
    id={props.htmlId}
    checked={props.checked}
    onChange={props.onChange}
    label={props.label}
  />
), ['label'], false, 'checked');

export const InputBooleanSelect = wrapInput((props) => {
  const section = useSections();

  const accessKey = useMemo(() => snakifyId(props.id, section), [props.id, section]);

  const options = useMemo(() => {
    const baseOptions = [true, false].map((bool) => ({
      value: bool,
      text: I18n.t(`competitions.competition_form.choices.${accessKey}.${bool.toString()}`),
    }));

    if (!props.forceChoice) {
      const noneOption = { value: null, text: '' };

      return [noneOption, ...baseOptions];
    }

    return baseOptions;
  }, [accessKey, props.forceChoice]);

  return (
    <Select
      options={options}
      value={props.value}
      onChange={props.onChange}
    />
  );
}, ['id', 'forceChoice']);

export const InputMap = wrapInput((props) => {
  const coords = [props.value.lat, props.value.long];

  const setCoords = useCallback((evt, newCoords) => props.onChange(evt, {
    value: {
      lat: newCoords[0],
      long: newCoords[1],
    },
  }), [props]);

  return (
    <div id="venue-map-wrapper">
      <CompetitionsMap id={props.wrapperId} coords={coords} setCoords={setCoords}>
        {props.circles && props.circles.map((circle) => (
          <Circle
            key={circle.id}
            center={coords}
            fill={false}
            radius={circle.radius * 1000}
            color={circle.color}
          />
        ))}
        <DraggableMarker coords={coords} setCoords={setCoords} disabled={props.disabled} />
        {props.markers && props.markers.map((marker) => (
          <StaticMarker key={marker.id} coords={marker.coords} />
        ))}
      </CompetitionsMap>
    </div>
  );
}, ['wrapperId', 'circles', 'markers', 'disabled']);

export const InputChampionships = wrapInput((props) => {
  const championships = props.value;

  const onChange = useCallback((newChampionships) => {
    props.onChange(null, { value: newChampionships });
  }, [props]);

  const onClickAdd = useCallback(() => {
    onChange([...championships, null]);
  }, [championships, onChange]);

  return (
    <>
      {championships.map((championship, index) => (
        <ChampionshipSelect
          key={`${championship}-${index + 1}`}
          value={championship}
          onChange={(evt, { value: newValue }) => {
            const newValueArray = [...championships];
            newValueArray[index] = newValue;
            onChange(newValueArray);
          }}
          onRemove={() => {
            const newValueArray = [...championships];
            newValueArray.splice(index, 1);
            onChange(newValueArray);
          }}
        />
      ))}
      <AddChampionshipButton onClick={onClickAdd} />
    </>
  );
});
