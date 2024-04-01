import React from 'react';
import { InputBooleanSelect, InputNumber, InputTextArea } from '../Inputs/FormInputs';
import { useStore } from '../../../lib/providers/StoreProvider';
import ConditionalSection from './ConditionalSection';
import SubSection from '../../wca/FormProvider/SubSection';

export default function CompetitorLimit() {
  const {
    competition: { competitorLimit },
  } = useStore();

  const hasLimit = competitorLimit.enabled;

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
