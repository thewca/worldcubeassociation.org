import React from 'react';
import { InputBooleanSelect, InputNumber, InputTextArea } from '../../wca/FormBuilder/input/FormInputs';
import ConditionalSection from './ConditionalSection';
import SubSection from '../../wca/FormBuilder/SubSection';
import { useFormObject } from '../../wca/FormBuilder/provider/FormObjectProvider';
import { useStore } from '../../../lib/providers/StoreProvider';

export default function CompetitorLimit() {
  const {
    competitorLimit: {
      enabled: hasLimit,
      autoAcceptEnabled: autoAcceptEnabled,
    },
  } = useFormObject();

  const { isAdminView } = useStore();

  return (
    <SubSection section="competitorLimit">
      <InputBooleanSelect id="enabled" forceChoice />
      <ConditionalSection showIf={hasLimit}>
        <InputNumber id="count" min={0} />
        <InputTextArea id="reason" />
        <InputNumber id="autoCloseThreshold" min={1} nullable />
        <InputNumber id="newcomerMonthReservedSpots" min={1} nullable />
      </ConditionalSection>
      <ConditionalSection showIf={isAdminView}>
        <InputBooleanSelect id="autoAcceptEnabled" required />
        <ConditionalSection showIf={autoAcceptEnabled}>
          <InputNumber id="autoAcceptDisableThreshold" nullable />
        </ConditionalSection>
      </ConditionalSection>
    </SubSection>
  );
}
