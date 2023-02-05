/* eslint-disable react/no-danger */
import React, { useEffect, useState } from 'react';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import { FieldWrapper } from './FormInputs';
import { seriesElegableCompetitionsUrl } from '../../lib/requests/routes.js.erb';
import I18n from '../../lib/i18n';
import CompsTable from './CompsTable';

export default function SeriesComps({
  latData, longData,
  startDateData, endDateData,
}) {
  // TODO: I think there is a bug where a comp shows up which is the current comp in edit mode
  const [nearby, setNearby] = useState();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!latData.value || !longData.value || !startDateData.value || !endDateData.value) return;
    setLoading(true);
    const params = new URLSearchParams();
    params.append(`competition[${latData.attribute}]`, latData.value);
    params.append(`competition[${longData.attribute}]`, longData.value);
    params.append(`competition[${startDateData.attribute}]`, startDateData.value);
    params.append(`competition[${endDateData.attribute}]`, endDateData.value);

    fetchJsonOrError(`${seriesElegableCompetitionsUrl}?${params.toString()}`).then(({ data }) => {
      setNearby(data);
      setLoading(false);
    });
  }, [latData.value, longData.value, startDateData.value, endDateData.value]);

  const label = I18n.t('competitions.adjacent_competitions.label', { days: 33, kms: 200 });

  return (
    <FieldWrapper label={label}>
      <CompsTable
        nearby={nearby}
        latData={latData}
        longData={longData}
        startDateData={startDateData}
        endDateData={endDateData}
        loading={loading}
        action={{
          label: 'Add to series',
          onClick: () => {},
        }}
      />
    </FieldWrapper>
  );
}
