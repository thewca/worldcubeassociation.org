/* eslint-disable react/no-danger */
import React, { useEffect, useState } from 'react';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import { FieldWrapper } from './FormInputs';
import { competitionNearbyJsonUrl } from '../../lib/requests/routes.js.erb';
import I18n from '../../lib/i18n';
import CompsTable from './CompsTable';

export default function NearbyComps({
  latData, longData,
  startDateData, endDateData,
  setCompMarkers,
}) {
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

    fetchJsonOrError(`${competitionNearbyJsonUrl}?${params.toString()}`).then(({ data }) => {
      setNearby(data);
      setCompMarkers(data.map((comp) => ({
        lat: comp.latitude_degrees,
        lng: comp.longitude_degrees,
      })));
      setLoading(false);
    });
  }, [latData.value, longData.value, startDateData.value, endDateData.value]);

  const label = I18n.t('competitions.adjacent_competitions.label', { days: 5, kms: 10 });

  return (
    <FieldWrapper label={label}>
      <CompsTable
        nearby={nearby}
        latData={latData}
        longData={longData}
        startDateData={startDateData}
        endDateData={endDateData}
        loading={loading}
      />
    </FieldWrapper>
  );
}
