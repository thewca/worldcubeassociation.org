import React from 'react';
import SubSection from './SubSection';
import { InputString, InputUsers } from '../Inputs/FormInputs';

export default function Staff() {
  return (
    <SubSection section="staff">
      <InputUsers id="staffDelegateIds" delegateOnly />
      <InputUsers id="traineeDelegateIds" traineeOnly />
      <InputUsers id="organizerIds" />
      <InputString id="contact" mdHint />
    </SubSection>
  );
}
