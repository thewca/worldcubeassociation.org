import React from 'react';
import SubSection from './SubSection';
import { InputBoolean } from '../Inputs/FormInputs';

export default function UserSettings() {
  return (
    <SubSection section="userSettings">
      <InputBoolean id="receiveRegistrationEmails" />
    </SubSection>
  );
}
