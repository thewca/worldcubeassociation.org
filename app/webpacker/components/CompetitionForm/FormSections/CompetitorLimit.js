import React from 'react';
import { InputBooleanSelect, InputNumber, InputTextArea } from '../../wca/FormBuilder/input/FormInputs';
import ConditionalSection from './ConditionalSection';
import SubSection from '../../wca/FormBuilder/SubSection';
import { useFormObject } from '../../wca/FormBuilder/provider/FormObjectProvider';

export default function CompetitorLimit() {
  const {
    competitorLimit: {
      enabled: hasLimit,
    },
  } = useFormObject();

  return (
    <SubSection section="competitorLimit">
      <InputBooleanSelect id="enabled" forceChoice />
      <ConditionalSection showIf={hasLimit}>
        <InputNumber id="count" min={0} />
        <InputTextArea id="reason" />
      </ConditionalSection>
    </SubSection>
  );
}
