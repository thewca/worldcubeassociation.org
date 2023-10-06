import React, { useMemo } from 'react';
import SubSection from './SubSection';
import {
  InputBoolean, InputCurrencyAmount, InputNumber, InputRadio, InputSelect,
} from '../Inputs/FormInputs';
import { currenciesData } from '../../../lib/wca-data.js.erb';
import I18n from '../../../lib/i18n';
import { calculateDuesUrl } from '../../../lib/requests/routes.js.erb';
import { useStore } from '../../../lib/providers/StoreProvider';
import useLoadedData from '../../../lib/hooks/useLoadedData';

const currenciesOptions = Object.keys(currenciesData.byIso).map((iso) => ({
  key: iso,
  value: iso,
  text: `${currenciesData.byIso[iso].name} (${iso})`,
}));

const guestsEnabledOptions = [{
  value: true,
  text: I18n.t('simple_form.options.competition.guests_enabled.true'),
},
{
  value: false,
  text: I18n.t('simple_form.options.competition.guests_enabled.false'),
}];

const guestMessageOptions = [{
  key: 'unclear',
  value: 'unclear',
  text: I18n.t('enums.competition.guest_entry_status.unclear'),
},
{
  key: 'free',
  value: 'free',
  text: I18n.t('enums.competition.guest_entry_status.free'),
},
{
  key: 'restricted',
  value: 'restricted',
  text: I18n.t('enums.competition.guest_entry_status.restricted'),
}];

export default function RegistrationFees() {
  const {
    competition: {
      venue: {
        countryId: country,
      },
      entryFees,
      competitorLimit,
    },
  } = useStore();

  const currency = entryFees.currency_code;

  const guestsGoFree = entryFees && !(entryFees.guests_entry_fee_lowest_denomination > 0);
  const guestsRestricted = entryFees && guestsGoFree && entryFees.guest_entry_status === 'restricted';

  const savedParams = useMemo(() => {
    const params = new URLSearchParams();

    params.append('competitor_limit_enabled', competitorLimit.competitor_limit_enabled);
    params.append('competitor_limit', competitorLimit.competitor_limit);
    params.append('currency_code', entryFees.currency_code);
    params.append('entry_fee_cents', entryFees.base_entry_fee_lowest_denomination);
    params.append('country_id', country);

    return params;
  }, [competitorLimit, country, entryFees]);

  const entryFeeDuesUrl = useMemo(
    () => `${calculateDuesUrl}?${savedParams.toString()}`,
    [savedParams],
  );

  const {
    data: duesJson,
    error,
    loading,
  } = useLoadedData(entryFeeDuesUrl);

  const duesText = useMemo(() => {
    if (error) {
      return I18n.t('competitions.competition_form.dues_estimate.ajax_error');
    }

    if (competitorLimit.competitor_limit_enabled) {
      return `${I18n.t('competitions.competition_form.dues_estimate.calculated', {
        limit: competitorLimit.competitor_limit,
        estimate: duesJson?.dues_value,
      })} (${currency})`;
    }

    return `${I18n.t('competitions.competition_form.dues_estimate.per_competitor', {
      estimate: duesJson?.dues_value,
    })} (${currency})`;
  }, [competitorLimit, currency, duesJson, error]);

  return (
    <SubSection section="entryFees">
      <InputSelect id="currency_code" options={currenciesOptions} />
      <InputCurrencyAmount id="base_entry_fee_lowest_denomination" currency={currency} />
      <p className="help-block">
        <b>
          {duesText}
        </b>
      </p>
      <InputBoolean id="enable_donations" />
      <InputRadio id="guests_enabled" options={guestsEnabledOptions} />
      <InputCurrencyAmount id="guests_entry_fee_lowest_denomination" currency={currency} />
      {guestsGoFree && <InputSelect id="guest_entry_status" options={guestMessageOptions} />}
      {guestsRestricted && <InputNumber id="guests_per_registration_limit" />}
    </SubSection>
  );
}
