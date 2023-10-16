import React, { useCallback, useMemo } from 'react';
import {
  Checkbox,
  Form,
  Input,
  Radio,
  Select,
} from 'semantic-ui-react';
import TextareaAutosize from 'react-autosize-textarea';
import { Circle } from 'react-leaflet';
import _ from 'lodash';
import I18n from '../../../lib/i18n';
import MarkdownEditor from './MarkdownEditor';
import { CompetitionSearch, UserSearch } from './WCASearch';
import AutonumericField from './AutonumericField';
import { useDispatch, useStore } from '../../../lib/providers/StoreProvider';
import { useCompetitionForm, useSections, useUpdateFormAction } from '../store/sections';
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

  return I18n.t(`competition.competition_form.hints.${yamlId}`);
}

function FieldWrapper({
  id,
  label,
  noLabel,
  blankLabel,
  hint,
  noHint,
  blankHint,
  mdHint,
  error,
  disabled,
  children,
}) {
  const section = useSections();

  const fallbackLabel = blankLabel ? '' : '&nbsp;';
  const htmlLabel = noLabel ? fallbackLabel : label || getFieldLabel(id, section);

  const fallbackHint = blankHint ? '' : '&nbsp;';
  const htmlHint = noHint ? fallbackHint : hint || getFieldHint(id, section, mdHint);

  return (
    <Form.Field
      error={!!error}
      className={error && 'has-error'}
      disabled={!!disabled}
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

/* eslint-disable react/destructuring-assignment */
const wrapInput = (
  WrappedInput,
  additionalPropNames,
  emptyStringForNull = false,
  inputValueKey = 'value',
) => function WcaFormInput(props) {
  const { isAdminView, errors, competition: { admin: { isConfirmed } } } = useStore();
  const dispatch = useDispatch();

  const section = useSections();

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
  if (passDownLabel) inputProps.label = (props.label || getFieldLabel(props.id, section));

  const noLabel = props.noLabel || passDownLabel;
  const blankLabel = props.blankLabel || passDownLabel;

  const disabled = isConfirmed && !isAdminView;

  const passDownDisabled = additionalPropNames.includes('disabled');
  if (passDownDisabled) inputProps.disabled = disabled;

  /* eslint-disable react/jsx-props-no-spreading */
  return (
    <FieldWrapper
      id={props.id}
      label={props.label}
      noLabel={noLabel}
      blankLabel={blankLabel}
      hint={props.hint}
      blankHint={props.blankHint}
      noHint={props.noHint}
      mdHint={props.mdHint}
      error={error}
      disabled={disabled}
    >
      <WrappedInput
        {...inputProps}
        onChange={onChange}
      />
    </FieldWrapper>
  );
  /* eslint-enable react/jsx-props-no-spreading */
};
/* eslint-disable react/destructuring-assignment */

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
  }, [props]);

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
      <CompetitionsMap id={props.htmlId} coords={coords} setCoords={setCoords}>
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
}, ['htmlId', 'circles', 'markers', 'disabled']);

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
}, []);
