import React, { useMemo } from 'react';
import SubSection from './SubSection';
import {
  InputBoolean,
  InputCurrencyAmount, InputDate, InputNumber,
  InputSelect,
} from '../Inputs/FormInputs';
import { currenciesData } from '../../../lib/wca-data.js.erb';
import I18n from '../../../lib/i18n';
import { calculateDuesUrl } from '../../../lib/requests/routes.js.erb';
import { useStore } from '../../../lib/providers/StoreProvider';
import useLoadedData from '../../../lib/hooks/useLoadedData';
import ConditionalSection from './ConditionalSection';

const currenciesOptions = Object.keys(currenciesData.byIso).map((iso) => ({
  key: iso,
  value: iso,
  text: `${currenciesData.byIso[iso].name} (${iso})`,
}));

export default function RegistrationFees() {
  const {
    competition: {
      venue: {
        countryId: country,
      },
      entryFees,
      competitorLimit,
      registration,
    },
  } = useStore();

  const currency = entryFees.currencyCode;

  const canRegOnSite = registration && registration.allowOnTheSpot;

  const savedParams = useMemo(() => {
    const params = new URLSearchParams();

    params.append('competitor_limit_enabled', competitorLimit.enabled);
    params.append('competitor_limit', competitorLimit.count);
    params.append('currency_code', entryFees.currencyCode);
    params.append('base_entry_fee_lowest_denomination', entryFees.baseEntryFee);
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
  } = useLoadedData(entryFeeDuesUrl);

  const duesText = useMemo(() => {
    if (error || !duesJson?.dues_value) {
      return I18n.t('competitions.competition_form.dues_estimate.ajax_error');
    }

    if (competitorLimit.enabled) {
      return `${I18n.t('competitions.competition_form.dues_estimate.calculated', {
        limit: competitorLimit.count,
        estimate: duesJson?.dues_value,
      })} (${currency})`;
    }

    return `${I18n.t('competitions.competition_form.dues_estimate.per_competitor', {
      estimate: duesJson?.dues_value,
    })} (${currency})`;
  }, [competitorLimit, currency, duesJson, error]);

  return (
    <SubSection section="entryFees">
      <InputSelect id="currencyCode" options={currenciesOptions} required />
      <InputCurrencyAmount id="baseEntryFee" currency={currency} required />
      <p className="help-block">
        <b>
          {duesText}
        </b>
      </p>
      <ConditionalSection showIf={canRegOnSite}>
        <InputCurrencyAmount id="onTheSpotEntryFee" currency={currency} required={canRegOnSite} />
      </ConditionalSection>
      <InputCurrencyAmount id="guestEntryFee" currency={currency} />
      <InputBoolean id="donationsEnabled" />
      <InputNumber id="refundPolicyPercent" min={0} max={100} step={1} defaultValue={0} required />
      <InputDate id="refundPolicyLimitDate" dateTime required />
    </SubSection>
  );
}
