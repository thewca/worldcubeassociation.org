/* eslint-disable react/no-danger */
/* eslint-disable camelcase */
import React, { useContext, useEffect, useState } from 'react';
import { Message } from 'semantic-ui-react';
import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { seriesEligibleCompetitionsJsonUrl } from '../../../lib/requests/routes.js.erb';
import I18n from '../../../lib/i18n';
import CompsTable from './CompsTable';
import FormContext from '../State/FormContext';
import Loading from '../../Requests/Loading';
import TableWrapper from './TableWrapper';

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
    formData: {
      id,
      venue: {
        coordinates,
      },
      start_date,
      end_date,
      series,
    },
    setFormData,
    setMarkers,
  } = useContext(FormContext);

  const [nearby, setNearby] = useState();
  const [loading, setLoading] = useState(false);

  const [savedParams, setSavedParams] = useState(null);

  const lat = parseFloat(coordinates.lat);
  const long = parseFloat(coordinates.long);

  const missingDate = !start_date || !end_date;
  const missingLocation = !coordinates
    || Number.isNaN(lat)
    || Number.isNaN(long);

  useEffect(() => {
    if (missingDate || missingLocation) return;
    setLoading(true);
    const params = new URLSearchParams();
    params.append('id', id);
    params.append('coordinates_lat', lat.toString());
    params.append('coordinates_long', long.toString());
    params.append('start_date', start_date);
    params.append('end_date', end_date);

    setSavedParams(params);
  }, [id, coordinates, start_date, end_date]);

  useEffect(() => {
    if (!savedParams) return;

    fetchJsonOrError(`${seriesEligibleCompetitionsJsonUrl}?${savedParams.toString()}`)
      .then(({ data }) => {
        setNearby(data);
        setMarkers(data.map((comp) => ({
          id: comp.id,
          lat: comp.coordinates.lat,
          long: comp.coordinates.long,
        })));
      })
      .finally(() => setLoading(false));
  }, [savedParams]);

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
          label: 'Add to series',
          onClick: (comp) => {
            setFormData((previousData) => ({
              ...previousData,
              series: {
                competitionIds: comp.id,
              },
            }));
          },
        }}
      />
    </TableWrapper>
  );
}
