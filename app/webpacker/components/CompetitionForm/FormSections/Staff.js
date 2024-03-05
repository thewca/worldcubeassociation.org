import React from 'react';
import SubSection from './SubSection';
import { InputString, InputUsers } from '../Inputs/FormInputs';

export default function Staff() {
  return (
    <SubSection section="staff">
      <InputUsers id="staffDelegateIds" delegateOnly required />
      <InputUsers id="traineeDelegateIds" traineeOnly />
      <InputUsers id="organizerIds" required />
      <InputString id="contact" mdHint />
    </SubSection>
  );
}
