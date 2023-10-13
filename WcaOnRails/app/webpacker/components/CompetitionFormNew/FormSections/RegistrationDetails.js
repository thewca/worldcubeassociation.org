import React from 'react';
import SubSection from './SubSection';
import {
  InputBoolean,
  InputBooleanSelect,
  InputCurrencyAmount,
  InputDate,
  InputMarkdown,
  InputNumber,
} from '../Inputs/FormInputs';
import { useStore } from '../../../lib/providers/StoreProvider';
import ConditionalSection from './ConditionalSection';

export default function RegistrationDetails() {
  const { competition: { regDetails: regDetailsData, entryFees } } = useStore();

  const currency = entryFees.currency_code;

  const canRegOnSite = regDetailsData && regDetailsData.on_the_spot_registration === 'true';

  return (
    <SubSection section="regDetails">
      <InputNumber id="refund_policy_percent" />
      <InputDate id="refund_policy_limit_date" dateTime />
      <InputDate id="waiting_list_deadline_date" dateTime />
      <InputDate id="event_change_deadline_date" dateTime />
      <InputBooleanSelect id="on_the_spot_registration" />
      <ConditionalSection showIf={canRegOnSite}>
        <InputCurrencyAmount id="on_the_spot_entry_fee_lowest_denomination" currency={currency} />
      </ConditionalSection>
      <InputBooleanSelect id="allow_registration_edits" />
      <InputBooleanSelect id="allow_registration_self_delete_after_acceptance" />
      <InputMarkdown id="extra_registration_requirements" />
      <InputBoolean id="force_comment_in_registration" />
    </SubSection>
  );
}
