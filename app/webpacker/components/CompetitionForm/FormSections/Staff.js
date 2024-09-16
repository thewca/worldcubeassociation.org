import React from 'react';
import { InputString, InputUsers } from '../../wca/FormBuilder/input/FormInputs';
import SubSection from '../../wca/FormBuilder/SubSection';

export default function Staff() {
  return (
    <SubSection section="staff" ignoreDisabled>
      <InputUsers id="staffDelegateIds" delegateOnly required />
      <InputUsers id="traineeDelegateIds" traineeOnly />
      <InputUsers id="organizerIds" required />
      <InputString id="contact" mdHint />
    </SubSection>
  );
}
