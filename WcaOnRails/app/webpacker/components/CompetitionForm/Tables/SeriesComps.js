/* eslint-disable react/no-danger */
/* eslint-disable camelcase */
import React, { useMemo } from 'react';
import { Message } from 'semantic-ui-react';
import { seriesEligibleCompetitionsJsonUrl } from '../../../lib/requests/routes.js.erb';
import I18n from '../../../lib/i18n';
import CompsTable from './CompsTable';
import Loading from '../../Requests/Loading';
import TableWrapper from './TableWrapper';
import { useDispatch, useStore } from '../../../lib/providers/StoreProvider';
import { updateFormValue } from '../store/actions';
import useLoadedData from '../../../lib/hooks/useLoadedData';

function MissingInfo({ missingDate, missingLocation }) {
  return (
    <Message negative>
      {missingDate && (<p>{I18n.t('competitions.adjacent_competitions.no_date_yet')}</p>)}
      {missingLocation && (<p>{I18n.t('competitions.adjacent_competitions.no_location_yet')}</p>)}
    </Message>
  );
}

export default function SeriesComps() {
  const {
    competition: {
      competitionId,
      venue: {
        coordinates,
      },
      startDate,
      endDate,
      series,
    },
  } = useStore();

  const dispatch = useDispatch();

  const lat = parseFloat(coordinates.lat);
  const long = parseFloat(coordinates.long);

  const missingDate = !startDate || !endDate;
  const missingLocation = !coordinates
    || Number.isNaN(lat)
    || Number.isNaN(long);

  const savedParams = useMemo(() => {
    const params = new URLSearchParams();

    if (missingDate || missingLocation) return params;

    params.append('id', competitionId);
    params.append('latitude_degrees', lat.toString());
    params.append('longitude_degrees', long.toString());
    params.append('start_date', startDate);
    params.append('end_date', endDate);

    return params;
  }, [competitionId, lat, long, startDate, endDate, missingDate, missingLocation]);

  const seriesEligibleDataUrl = useMemo(
    () => `${seriesEligibleCompetitionsJsonUrl}?${savedParams.toString()}`,
    [savedParams],
  );

  const {
    data: nearby,
    loading,
  } = useLoadedData(seriesEligibleDataUrl);

  const label = I18n.t('competitions.adjacent_competitions.label', { days: 33, kms: 200 });

  if (series) return null;

  if (loading) {
    return (
      <TableWrapper label={label}>
        <Loading />
      </TableWrapper>
    );
  }

  if (missingDate || missingLocation) {
    return (
      <TableWrapper label={label}>
        <MissingInfo missingDate={missingDate} missingLocation={missingLocation} />
      </TableWrapper>
    );
  }

  return (
    <TableWrapper label={label}>
      <CompsTable
        comps={nearby}
        action={{
          label: I18n.t('competitions.competition_series_fields.add_series'),
          onClick: (comp) => dispatch(updateFormValue('series', { competitionIds: comp.id })),
        }}
      />
    </TableWrapper>
  );
}
