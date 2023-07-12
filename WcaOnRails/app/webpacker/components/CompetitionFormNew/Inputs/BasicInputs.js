import React, {useCallback, useContext} from 'react';
import { Form, Input, Select } from 'semantic-ui-react';
import I18n from '../../../lib/i18n';
import FormContext from '../State/FormContext';

function getInputStateLabel(id) {
  return I18n.t(`activerecord.attributes.competition.${id}`);
}

function getInputStateHint(id, md) {
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
  const htmlLabel = noLabel ? '&#8203;' : label || getInputStateLabel(id);
  const htmlHint = noHint ? '&#8203;' : hint || getInputStateHint(id, mdHint);

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

export const InputSelect = wrapInput((props) => (
  <Select options={props.options} value={props.value} onChange={props.onChange} />
), ['options']);

export const InputString = wrapInput((props) => (
  <Input label={props.attachedLabel} value={props.value} onChange={props.onChange} />
), ['attachedLabel']);
