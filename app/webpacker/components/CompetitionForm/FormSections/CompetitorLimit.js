import React from 'react';
import { InputBooleanSelect, InputNumber, InputTextArea } from '../../wca/FormBuilder/input/FormInputs';
import ConditionalSection from './ConditionalSection';
import SubSection from '../../wca/FormBuilder/SubSection';
import { newcomerMonthEnabled } from '../../../lib/wca-data.js.erb';
import { useFormObject } from '../../wca/FormBuilder/provider/FormObjectProvider';

export default function CompetitorLimit() {
  const {
    competitorLimit: {
      enabled: hasLimit,
      autoAcceptPreference,
    },
  } = useFormObject();

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
      <InputBooleanSelect id="autoAcceptPreference" required />
      <ConditionalSection showIf={autoAcceptPreference !== 0}>
        <InputNumber id="autoAcceptDisableThreshold" nullable />
      </ConditionalSection>
    </SubSection>
  );
}
