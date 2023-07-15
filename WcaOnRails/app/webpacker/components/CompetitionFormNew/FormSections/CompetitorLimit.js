import React, { useContext } from 'react';
import SubSection from './SubSection';
import { InputBooleanSelect, InputNumber, InputTextArea } from '../Inputs/FormInputs';
import FormContext from '../State/FormContext';

export default function CompetitorLimit() {
  const { formData } = useContext(FormContext);

  const hasLimit = formData.competitorLimit && formData.competitorLimit.competitor_limit_enabled === 'true';
  return (
    <SubSection section="competitorLimit">
      <InputBooleanSelect id="competitor_limit_enabled" />
      {hasLimit && <InputNumber id="competitor_limit" min={0} />}
      {hasLimit && <InputTextArea id="competitor_limit_reason" min={0} />}
    </SubSection>
  );
}
