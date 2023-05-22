import React from 'react';
import { Button, Form } from 'semantic-ui-react';
import { CompetitionSearch, InputString, useFormInputState } from './FormInputs';
import I18n from '../../lib/i18n';

function labelText(attribute) {
  return I18n.t(`activerecord.attributes.competition_series.${attribute}`);
}

function hintText(attribute) {
  return I18n.t(`simple_form.hints.competition.competition_series.${attribute}`) || '';
}

export default function SeriesInput({ inputState }) {
  const series = inputState.value;
  if (!series) return null;

  const idData = useFormInputState('wcif_id', series);
  const nameData = useFormInputState('name', series);
  const shortNameData = useFormInputState('short_name', series);
  const compIdsData = useFormInputState('competition_ids', series);

  const removeFromSeries = () => {
    inputState.onChange(null);
  };

  return (
    <>
      {series.persisted && (
        <InputString
          inputState={idData}
          label={labelText(idData.attribute)}
          hint=""
        />
      )}
      <InputString
        inputState={nameData}
        label={labelText(nameData.attribute)}
        hint={hintText(nameData.attribute)}
      />
      {series.persisted && (
        <InputString
          inputState={shortNameData}
          label={labelText(shortNameData.attribute)}
          hint={hintText(shortNameData.attribute)}
        />
      )}
      <CompetitionSearch
        inputState={compIdsData}
        lock
        label={labelText(compIdsData.attribute)}
        hint={hintText(compIdsData.attribute)}
      />
      <Form.Field>
        <Button color="red" type="button" onClick={removeFromSeries}>
          {I18n.t('competitions.competition_series_fields.remove_series')}
        </Button>
      </Form.Field>
    </>
  );
}
