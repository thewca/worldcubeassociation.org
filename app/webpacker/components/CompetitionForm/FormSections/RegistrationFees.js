import React, { useState } from 'react';
import { Button } from 'semantic-ui-react';
import {
  InputBoolean,
  InputCurrencyAmount,
  InputDate,
  InputNumber,
  InputSelect,
} from '../../wca/FormBuilder/input/FormInputs';
import { currenciesData } from '../../../lib/wca-data.js.erb';
import ConditionalSection from './ConditionalSection';
import SubSection from '../../wca/FormBuilder/SubSection';
import { useFormObject } from '../../wca/FormBuilder/provider/FormObjectProvider';
import DuesEstimate from './DuesEstimate';

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
    entryFees,
    competitorLimit,
    registration,
  } = useFormObject();
  const [showDuesEstimate, setShowDuesEstimate] = useState(false);

  const currency = entryFees.currencyCode;

  const canRegOnSite = registration && registration.allowOnTheSpot;

  return (
    <SubSection section="entryFees">
      <InputSelect id="currencyCode" options={currenciesOptions} required />
      <InputCurrencyAmount id="baseEntryFee" currency={currency} required />
      <Button onClick={() => setShowDuesEstimate(true)}>Show Dues Estimate</Button>
      {showDuesEstimate && (
        <DuesEstimate
          close={() => setShowDuesEstimate(false)}
          countryId={country}
          currencyCode={entryFees.currencyCode}
          baseEntryFee={entryFees.baseEntryFee}
          competitorLimit={competitorLimit.count}
        />
      )}
      <ConditionalSection showIf={canRegOnSite}>
        <InputCurrencyAmount id="onTheSpotEntryFee" currency={currency} required={canRegOnSite} />
      </ConditionalSection>
      <InputCurrencyAmount id="guestEntryFee" currency={currency} />
      <InputBoolean id="donationsEnabled" />
      <InputNumber id="refundPolicyPercent" min={0} max={100} step={1} required />
      <InputDate id="refundPolicyLimitDate" dateTime required />
    </SubSection>
  );
}
