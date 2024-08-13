import React, { useCallback, useEffect, useMemo } from 'react';
import {
  InputBoolean,
  InputCurrencyAmount,
  InputDate,
  InputNumber,
  InputSelect,
} from '../../wca/FormBuilder/input/FormInputs';
import { currenciesData } from '../../../lib/wca-data.js.erb';
import I18n from '../../../lib/i18n';
import { calculateDuesUrl } from '../../../lib/requests/routes.js.erb';
import useLoadedData from '../../../lib/hooks/useLoadedData';
import ConditionalSection from './ConditionalSection';
import SubSection from '../../wca/FormBuilder/SubSection';
import { useFormInitialObject, useFormObject } from '../../wca/FormBuilder/provider/FormObjectProvider';
import { useFormUpdateAction } from '../../wca/FormBuilder/EditForm';

const currenciesOptions = Object.keys(currenciesData.byIso).map((iso) => ({
  key: iso,
  value: iso,
  text: `${currenciesData.byIso[iso].name} (${iso})`,
}));

export default function RegistrationFees() {
  const {
    venue: {
      countryId: country,
    },
    entryFees: {
      baseEntryFee,
      currencyCode: currency,
    },
    competitorLimit,
    registration,
  } = useFormObject();

  const { registration: originalRegistration } = useFormInitialObject();

  const updateFormValue = useFormUpdateAction();

  const setOtsRegistrationFee = useCallback((otsFee) => {
    updateFormValue('onTheSpotEntryFee', otsFee, ['entryFees']);
  }, [updateFormValue]);

  const canRegOnSite = registration && registration.allowOnTheSpot;
  const initialCanRegOnSite = originalRegistration && originalRegistration.allowOnTheSpot;

  const savedParams = useMemo(() => {
    const params = new URLSearchParams();

    params.append('competitor_limit_enabled', competitorLimit.enabled);
    params.append('competitor_limit', competitorLimit.count);
    params.append('currency_code', currency);
    params.append('base_entry_fee_lowest_denomination', baseEntryFee);
    params.append('country_id', country);

    return params;
  }, [competitorLimit, country, baseEntryFee, currency]);

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

  useEffect(() => {
    if (canRegOnSite && !initialCanRegOnSite) {
      setOtsRegistrationFee(baseEntryFee);
    }
  }, [baseEntryFee, canRegOnSite, initialCanRegOnSite, setOtsRegistrationFee]);

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
        <InputCurrencyAmount id="onTheSpotEntryFee" currency={currency} required={canRegOnSite} overrideEnabled />
      </ConditionalSection>
      <InputCurrencyAmount id="guestEntryFee" currency={currency} />
      <InputBoolean id="donationsEnabled" overrideEnabled />
      <InputNumber id="refundPolicyPercent" min={0} max={100} step={1} defaultValue={0} required />
      <InputDate id="refundPolicyLimitDate" dateTime required />
    </SubSection>
  );
}
