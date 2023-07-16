import React, { useContext } from 'react';
import SubSection from './SubSection';
import {
  InputBoolean, InputCurrencyAmount, InputNumber, InputRadio, InputSelect,
} from '../Inputs/FormInputs';
import { currenciesData } from '../../../lib/wca-data.js.erb';
import FormContext from '../State/FormContext';
import I18n from '../../../lib/i18n';

const currenciesOptions = Object.keys(currenciesData.byIso).map((iso) => ({
  key: iso,
  value: iso,
  text: `${currenciesData.byIso[iso].name} (${iso})`,
}));

const guestsEnabledOptions = [{
  value: 'true',
  text: I18n.t('simple_form.options.competition.guests_enabled.true'),
},
{
  value: 'false',
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

export default function RegistrationFees({ currency }) {
  const feeData = useContext(FormContext).formData.entryFees;

  const guestsGoFree = feeData && !(feeData.guests_entry_fee_lowest_denomination > 0);
  const guestsRestricted = feeData && guestsGoFree && feeData.guest_entry_status === 'restricted';
  return (
    <SubSection section="entryFees">
      <InputSelect id="currency_code" options={currenciesOptions} />
      <InputCurrencyAmount id="base_entry_fee_lowest_denomination" currency={currency} />
      <InputBoolean id="enable_donations" />
      <InputRadio id="guests_enabled" options={guestsEnabledOptions} />
      <InputCurrencyAmount id="guests_entry_fee_lowest_denomination" currency={currency} />
      {guestsGoFree && <InputSelect id="guest_entry_status" options={guestMessageOptions} />}
      {guestsRestricted && <InputNumber id="guests_per_registration_limit" />}
    </SubSection>
  );
}
