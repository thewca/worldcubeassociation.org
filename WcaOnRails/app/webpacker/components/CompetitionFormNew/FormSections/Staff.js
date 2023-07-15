import React from 'react';
import SubSection from './SubSection';
import { InputString, InputUsers } from '../Inputs/FormInputs';

export default function Staff() {
  return (
    <SubSection section="staff">
      <InputUsers id="staff_delegate_ids" delegateOnly />
      <InputUsers id="trainee_delegate_ids" traineeOnly />
      <InputUsers id="organizer_ids" />
      <InputString id="contact" mdHint />
    </SubSection>
  );
}
