import React from 'react';
import { Button } from 'semantic-ui-react';
import SubSection from './SubSection';
import { InputCompetitions, InputString } from '../Inputs/FormInputs';
import SeriesComps from '../Tables/SeriesComps';
import I18n from '../../../lib/i18n';
import { useDispatch, useStore } from '../../../lib/providers/StoreProvider';
import { updateFormValue } from '../store/actions';
import { competitionMaxShortNameLength } from '../../../lib/wca-data.js.erb';

export default function Series() {
  const {
    competition: {
      series,
    },
    isAdminView,
    isSeriesPersisted,
  } = useStore();

  const dispatch = useDispatch();

  if (!series) return <SeriesComps />;

  const { name } = series;

  const nameAlreadyShort = !name || name.length <= competitionMaxShortNameLength;
  const disableIdAndShortName = !isAdminView && nameAlreadyShort;

  const removeFromSeries = () => dispatch(updateFormValue('series', null));

  return (
    <SubSection section="series">
      {isSeriesPersisted && <InputString id="seriesId" disabled={disableIdAndShortName} />}
      <InputString id="name" />
      {isSeriesPersisted && <InputString id="shortName" disabled={disableIdAndShortName} />}
      <InputCompetitions
        id="competitionIds"
        disabled
      />
      <Button
        negative
        onClick={removeFromSeries}
      >
        {I18n.t('competitions.competition_series_fields.remove_series')}
      </Button>
    </SubSection>
  );
}
