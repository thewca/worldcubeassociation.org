import React from 'react';
import SubSection from './SubSection';
import { InputBooleanSelect, InputNumber, InputTextArea } from '../Inputs/FormInputs';
import { useStore } from '../../../lib/providers/StoreProvider';
import ConditionalSection from './ConditionalSection';

export default function CompetitorLimit() {
  const { competition: { competitorLimit: limitData } } = useStore();

  const hasLimit = limitData && limitData.competitor_limit_enabled;

  return (
    <SubSection section="competitorLimit">
      <InputBooleanSelect id="competitor_limit_enabled" />
      <ConditionalSection showIf={hasLimit}>
        <InputNumber id="competitor_limit" min={0} />
        <InputTextArea id="competitor_limit_reason" min={0} />
      </ConditionalSection>
    </SubSection>
  );
}
