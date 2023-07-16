import React, { useContext } from 'react';
import SubSection from './SubSection';
import { InputBooleanSelect, InputNumber, InputTextArea } from '../Inputs/FormInputs';
import FormContext from '../State/FormContext';

export default function CompetitorLimit() {
  const limitData = useContext(FormContext).formData.competitorLimit;

  const hasLimit = limitData && limitData.competitor_limit_enabled;
  return (
    <SubSection section="competitorLimit">
      <InputBooleanSelect id="competitor_limit_enabled" />
      {hasLimit && <InputNumber id="competitor_limit" min={0} />}
      {hasLimit && <InputTextArea id="competitor_limit_reason" min={0} />}
    </SubSection>
  );
}
