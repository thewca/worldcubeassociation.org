import React from 'react';
import { Button } from 'semantic-ui-react';
import SubSection from './SubSection';
import { InputCompetitions, InputString } from '../Inputs/FormInputs';
import SeriesComps from '../Tables/SeriesComps';
import I18n from '../../../lib/i18n';
import { useDispatch, useStore } from '../../../lib/providers/StoreProvider';
import { updateFormValue } from '../store/actions';

export default function Series() {
  const {
    competition: {
      series,
    },
  } = useStore();

  const dispatch = useDispatch();

  if (!series) return <SeriesComps />;

  const removeFromSeries = () => dispatch(updateFormValue('series', null));

  return (
    <SubSection section="series">
      {series.persisted && (
        <InputString
          id="id"
          label={I18n.t('activerecord.attributes.competition_series.wcif_id')}
          hint=" "
        />
      )}
      <InputString
        id="name"
        label={I18n.t('activerecord.attributes.competition_series.name')}
        hint={I18n.t('simple_form.hints.competition.competition_series.name')}
      />
      {series.persisted && (
        <InputString
          id="shortName"
          label={I18n.t('activerecord.attributes.competition_series.short_name')}
          hint={I18n.t('simple_form.hints.competition.competition_series.short_name')}
        />
      )}
      <InputCompetitions
        id="competitionIds"
        freeze
        label={I18n.t('activerecord.attributes.competition_series.competition_ids')}
        hint={I18n.t('simple_form.hints.competition.competition_series.competition_ids')}
      />
      <Button
        color="red"
        onClick={removeFromSeries}
      >
        {I18n.t('competitions.competition_series_fields.remove_series')}
      </Button>
    </SubSection>
  );
}
