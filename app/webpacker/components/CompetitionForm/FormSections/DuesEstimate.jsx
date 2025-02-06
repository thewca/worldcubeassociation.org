import React from 'react';
import { Input, Modal } from 'semantic-ui-react';
import { QueryClient, useQuery } from '@tanstack/react-query';
import useInputState from '../../../lib/hooks/useInputState';
import { calculateDuesUrl } from '../../../lib/requests/routes.js.erb';
import { currenciesData } from '../../../lib/wca-data.js.erb';
import Loading from '../../Requests/Loading';
import Errored from '../../Requests/Errored';
import { fetchJsonOrError } from '../../../lib/requests/fetchWithAuthenticityToken';

const CALCULATE_DUES_QUERY_CLIENT = new QueryClient();

export default function DuesEstimate({
  close, countryId, currencyCode, baseEntryFee, competitorLimit,
}) {
  const [competitorCount, setCompetitorCount] = useInputState(competitorLimit || 0);
  const currencyInfo = currenciesData.byIso[currencyCode] || currenciesData.byIso.USD;

  const {
    data, isLoading, isError,
  } = useQuery({
    queryKey: [countryId, currencyCode, baseEntryFee],
    queryFn: () => fetchJsonOrError(calculateDuesUrl(countryId, currencyCode, baseEntryFee)),
  }, CALCULATE_DUES_QUERY_CLIENT);

  const { dues_value: duesValue } = data?.data || {};
  const totalDues = (duesValue * competitorCount || 0) / currencyInfo.subunitToUnit;

  if (isLoading) return <Loading />;
  if (isError) return <Errored error="Dues fetching failed..." />;

  return (
    <Modal
      open
      onClose={close}
      closeIcon
    >
      <Modal.Header>Dues Estimate</Modal.Header>
      <Modal.Content>
        <Input
          label="Competitor count"
          type="number"
          value={competitorCount}
          onChange={setCompetitorCount}
        />
        <p>
          {`Dues for ${competitorCount} competitors (approximately): ${
            totalDues.toLocaleString(
              undefined, // undefined will use the browser's default locale
              { style: 'currency', currency: currencyCode },
            )
          }`}
        </p>
      </Modal.Content>
    </Modal>
  );
}
