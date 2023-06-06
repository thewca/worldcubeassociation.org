/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import I18n from '../../lib/i18n';
import { fetchWithAuthenticityToken } from '../../lib/requests/fetchWithAuthenticityToken';
import { calculateDuesUrl } from '../../lib/requests/routes.js.erb';

export default function DuesEstimate({
  country,
  currency,
  feeCents,
  compLimitEnabled,
  compLimit,
}) {
  const [duesText, setDuesText] = useState('');
  useEffect(() => {
    const params = new URLSearchParams();
    params.append('competitor_limit_enabled', compLimitEnabled);
    params.append('competitor_limit', compLimit);
    params.append('currency_code', currency);
    params.append('country_id', country);
    params.append('entry_fee_cents', feeCents);

    fetchWithAuthenticityToken(`${calculateDuesUrl}?${params.toString()}`)
      .then((response) => response.json()
        .then((json) => {
          if (!response.ok) {
            setDuesText(I18n.t('competitions.competition_form.dues_estimate.ajax_error'));
            return;
          }

          let text;
          if (compLimitEnabled) {
            text = `${I18n.t('competitions.competition_form.dues_estimate.calculated', {
              limit: compLimit,
              estimate: json.dues_value,
            })} (${currency})`;
          } else {
            text = `${I18n.t('competitions.competition_form.dues_estimate.per_competitor', {
              estimate: json.dues_value,
            })} (${currency})`;
          }
          setDuesText(text);
        }));
  }, [country, currency, feeCents, compLimitEnabled, compLimit]);

  return !duesText ? null : (
    <p className="help-block">
      <b>
        {duesText}
      </b>
    </p>
  );
}
