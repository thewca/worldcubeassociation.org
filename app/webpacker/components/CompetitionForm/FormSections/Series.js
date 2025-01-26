import React from 'react';
import { Button } from 'semantic-ui-react';
import { InputCompetitions, InputString } from '../../wca/FormBuilder/input/FormInputs';
import SeriesComps from '../Tables/SeriesComps';
import I18n from '../../../lib/i18n';
import { useStore } from '../../../lib/providers/StoreProvider';
import { competitionMaxShortNameLength } from '../../../lib/wca-data.js.erb';
import SubSection from '../../wca/FormBuilder/SubSection';
import { useFormUpdateAction } from '../../wca/FormBuilder/EditForm';
import { useFormObject } from '../../wca/FormBuilder/provider/FormObjectProvider';
import { useSectionDisabled } from '../../wca/FormBuilder/provider/FormSectionProvider';

export default function Series() {
  const {
    isAdminView,
    isSeriesPersisted,
  } = useStore();

  const { series } = useFormObject();
  const sectionDisabled = useSectionDisabled();

  const updateFormObject = useFormUpdateAction();

  if (!series) return <SeriesComps />;

  const { name } = series;

  const nameAlreadyShort = !name || name.length <= competitionMaxShortNameLength;
  const disableIdAndShortName = !isAdminView && nameAlreadyShort;

  const removeFromSeries = () => updateFormObject('series', null);

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
        disabled={sectionDisabled}
        onClick={removeFromSeries}
      >
        {I18n.t('competitions.competition_series_fields.remove_series')}
      </Button>
    </SubSection>
  );
}
