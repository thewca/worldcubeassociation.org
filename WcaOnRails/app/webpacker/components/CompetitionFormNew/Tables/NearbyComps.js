/* eslint-disable react/no-danger */
/* eslint-disable camelcase */
import React, { useContext, useEffect, useState } from 'react';
import { Form, Message } from 'semantic-ui-react';
import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';
import { competitionNearbyJsonUrl } from '../../../lib/requests/routes.js.erb';
import I18n from '../../../lib/i18n';
import CompsTable from './CompsTable';
import FormContext from '../State/FormContext';
import Loading from '../../Requests/Loading';

function TableWrapper({ label, children }) {
  return (
    <Form.Field>
      {/* eslint-disable-next-line react/no-danger, jsx-a11y/label-has-associated-control */}
      <label dangerouslySetInnerHTML={{ __html: label }} />
      {children}
    </Form.Field>
  );
}

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
    formData: {
      id,
      venue: {
        coordinates,
      },
      start_date,
      end_date,
    },
    setMarkers,
  } = useContext(FormContext);

  const [nearby, setNearby] = useState();
  const [loading, setLoading] = useState(false);

  const [savedParams, setSavedParams] = useState(null);

  useEffect(() => {
    if (!coordinates || !coordinates.lat || !coordinates.long || !start_date || !end_date) return;
    setLoading(true);
    const params = new URLSearchParams();
    params.append('id', id);
    params.append('coordinates_lat', coordinates.lat);
    params.append('coordinates_long', coordinates.long);
    params.append('start_date', start_date);
    params.append('end_date', end_date);

    setSavedParams(params);
  }, [id, coordinates, start_date, end_date]);

  useEffect(() => {
    if (!savedParams) return;

    fetchJsonOrError(`${competitionNearbyJsonUrl}?${savedParams.toString()}`)
      .then(({ data }) => {
        setNearby(data);
        setMarkers(data.map((comp) => ({
          id: comp.id,
          lat: comp.coordinates.lat,
          long: comp.coordinates.long,
        })));
      })
      .finally(() => setLoading(false));
    console.log('sent req');
  }, [savedParams]);

  const label = I18n.t('competitions.adjacent_competitions.label', { days: 5, kms: 10 });

  if (loading) {
    return (
      <TableWrapper label={label}>
        <Loading />
      </TableWrapper>
    );
  }

  const missingDate = !start_date || !end_date;
  const missingLocation = !coordinates || !coordinates.lat || !coordinates.long;
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
