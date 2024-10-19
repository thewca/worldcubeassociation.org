import React from 'react';
import { InputString, InputUsers } from '../../wca/FormBuilder/input/FormInputs';
import SubSection from '../../wca/FormBuilder/SubSection';

export default function Staff() {
  return (
    <SubSection section="staff">
      <InputUsers id="staffDelegateIds" delegateOnly required ignoreDisabled />
      <InputUsers id="traineeDelegateIds" traineeOnly ignoreDisabled />
      <InputUsers id="organizerIds" required ignoreDisabled />
      <InputString id="contact" mdHint ignoreDisabled />
    </SubSection>
  );
}
