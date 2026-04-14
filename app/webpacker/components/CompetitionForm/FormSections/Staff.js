import React from 'react';
import { InputRadioUser, InputString, InputUsers } from '../../wca/FormBuilder/input/FormInputs';
import SubSection from '../../wca/FormBuilder/SubSection';
import { useFormValue } from '../../wca/FormBuilder/provider/FormObjectProvider';

export default function Staff() {
  const appointedDelegateIds = useFormValue('staffDelegateIds', ['staff']);

  return (
    <SubSection section="staff">
      <InputUsers id="staffDelegateIds" delegateOnly required ignoreDisabled />
      {appointedDelegateIds.length > 0 && (
        <InputRadioUser id="leadDelegateId" required options={appointedDelegateIds} />
      )}
      <InputUsers id="traineeDelegateIds" traineeOnly ignoreDisabled />
      <InputUsers id="organizerIds" required ignoreDisabled />
      <InputString id="contact" mdHint ignoreDisabled />
    </SubSection>
  );
}
