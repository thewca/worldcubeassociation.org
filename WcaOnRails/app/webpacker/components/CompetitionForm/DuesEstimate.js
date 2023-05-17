/* eslint-disable no-unused-vars */
import React, { useEffect } from 'react';
import { fetchJsonOrError } from '../../lib/requests/fetchWithAuthenticityToken';
import { calculateDuesUrl } from '../../lib/requests/routes.js.erb';

export default function DuesEstimate({
  country,
  currency,
  feeCents,
  compLimitEnabled,
  compLimit,
}) {
  useEffect(() => {
    const params = new URLSearchParams();
    params.append('competitor_limit_enabled', compLimitEnabled);
    params.append('competitor_limit', compLimit);
    params.append('currency_code', currency);
    params.append('country_id', country);
    params.append('entry_fee_cents', feeCents);

    fetchJsonOrError(`${calculateDuesUrl}?${params.toString()}`)
      .then((e) => {
        // eslint-disable-next-line no-console
        console.log(e);
      });
  });

  return (
    <p className="help-block">
      <b>
        The estimated WCA Dues per competitor are $0.00 (USD)
      </b>
    </p>
  );
}
