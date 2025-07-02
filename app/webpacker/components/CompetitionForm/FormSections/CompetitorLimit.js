import React from 'react';
import {
  InputBooleanSelect, InputNumber, InputSelect, InputTextArea,
} from '../../wca/FormBuilder/input/FormInputs';
import ConditionalSection from './ConditionalSection';
import SubSection from '../../wca/FormBuilder/SubSection';
import { autoAcceptPreferences, newcomerMonthEnabled } from '../../../lib/wca-data.js.erb';
import { useFormObject } from '../../wca/FormBuilder/provider/FormObjectProvider';
import { useStore } from '../../../lib/providers/StoreProvider';

export default function CompetitorLimit() {
  const {
    competitorLimit: {
      enabled: hasLimit,
      autoAcceptPreference,
    },
  } = useFormObject();


  const { isAdminView } = useStore();

  console.log("preferences")
  console.log(autoAcceptPreferences)
  console.log(autoAcceptPreferences.bulk)

  const preferenceKeys = Object.keys(autoAcceptPreferences)
  const availableAutoAcceptPreferences = isAdminView
    ? preferenceKeys
    : [preferenceKeys[0], preferenceKeys[1]]

  const autoAcceptOptions = availableAutoAcceptPreferences.map((status) => ({
    key: status,
    value: status,
    text: I18n.t(`competitions.competition_form.choices.competitor_limit.auto_accept_preference.${status}`),
  }));

  return (
    <SubSection section="competitorLimit">
      <InputBooleanSelect id="enabled" forceChoice />
      <ConditionalSection showIf={hasLimit}>
        <InputNumber id="count" min={0} />
        <InputTextArea id="reason" />
        <InputNumber id="autoCloseThreshold" min={1} nullable />
        <ConditionalSection showIf={newcomerMonthEnabled}>
          <InputNumber id="newcomerMonthReservedSpots" min={1} nullable />
        </ConditionalSection>
      </ConditionalSection>
      <InputSelect id="autoAcceptPreference" options={autoAcceptOptions} required ignoreDisabled />
      <ConditionalSection showIf={autoAcceptPreference !== 'disabled'}>
        <InputNumber id="autoAcceptDisableThreshold" nullable ignoreDisabled />
      </ConditionalSection>
    </SubSection>
  );
}
