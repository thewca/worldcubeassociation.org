import React from 'react';
import { InputBooleanSelect, InputNumber, InputTextArea } from '../Inputs/FormInputs';
import ConditionalSection from './ConditionalSection';
import SubSection from '../../wca/FormProvider/SubSection';
import { useFormObject } from '../../wca/FormProvider/EditForm';

export default function CompetitorLimit() {
  const {
    competitorLimit: { enabled: hasLimit },
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
