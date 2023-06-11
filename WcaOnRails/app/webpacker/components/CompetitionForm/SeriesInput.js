import React from 'react';
import { Button, Form } from 'semantic-ui-react';
import {
  CompetitionSearch,
  InputString,
  useNestedFormInputState,
} from './FormInputs';
import I18n from '../../lib/i18n';

function labelText(attribute) {
  return I18n.t(`activerecord.attributes.competition_series.${attribute}`);
}

function hintText(attribute) {
  return I18n.t(`simple_form.hints.competition.competition_series.${attribute}`) || '';
}

export default function SeriesInput({
  inputState,
  setFormData,
  competition,
}) {
  const rootAttribute = inputState.attribute;
  const series = inputState.value;
  if (!series) return null;

  const idData = useNestedFormInputState(setFormData, rootAttribute, 'wcif_id', competition);
  const nameData = useNestedFormInputState(setFormData, rootAttribute, 'name', competition);
  const shortNameData = useNestedFormInputState(setFormData, rootAttribute, 'short_name', competition);
  const compIdsData = useNestedFormInputState(setFormData, rootAttribute, 'competition_ids', competition);

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
