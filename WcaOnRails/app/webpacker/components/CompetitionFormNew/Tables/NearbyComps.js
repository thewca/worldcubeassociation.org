/* eslint-disable react/no-danger */
/* eslint-disable camelcase */
import React, { useMemo } from 'react';
import { Message } from 'semantic-ui-react';
import { competitionNearbyJsonUrl } from '../../../lib/requests/routes.js.erb';
import I18n from '../../../lib/i18n';
import CompsTable from './CompsTable';
import Loading from '../../Requests/Loading';
import TableWrapper from './TableWrapper';
import { useStore } from '../../../lib/providers/StoreProvider';
import useLoadedData from '../../../lib/hooks/useLoadedData';

function MissingInfo({ missingDate, missingLocation }) {
  return (
    <Message negative>
      {missingDate && (<p>{I18n.t('competitions.adjacent_competitions.no_date_yet')}</p>)}
      {missingLocation && (<p>{I18n.t('competitions.adjacent_competitions.no_location_yet')}</p>)}
    </Message>
  );
}

export default function NearbyComps() {
  const {
    competition: {
      id,
      venue: {
        coordinates,
      },
      startDate,
      endDate,
    },
  } = useStore();

  const lat = parseFloat(coordinates.lat);
  const long = parseFloat(coordinates.long);

  const missingDate = !startDate || !endDate;
  const missingLocation = !coordinates
    || Number.isNaN(lat)
    || Number.isNaN(long);

  const savedParams = useMemo(() => {
    const params = new URLSearchParams();

    if (missingDate || missingLocation) return params;

    params.append('id', id);
    params.append('coordinates_lat', lat.toString());
    params.append('coordinates_long', long.toString());
    params.append('start_date', startDate);
    params.append('end_date', endDate);

    return params;
  }, [id, lat, long, startDate, endDate, missingDate, missingLocation]);

  const nearbyDataUrl = useMemo(
    () => `${competitionNearbyJsonUrl}?${savedParams.toString()}`,
    [savedParams],
  );

  const {
    data: nearby,
    loading,
  } = useLoadedData(nearbyDataUrl);

  const label = I18n.t('competitions.adjacent_competitions.label', { days: 5, kms: 10 });

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
      <CompsTable comps={nearby} />
    </TableWrapper>
  );
}
