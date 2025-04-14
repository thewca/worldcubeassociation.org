import React from 'react';
import {
  InputBoolean,
  InputBooleanSelect,
  InputString,
  InputTextArea,
} from '../../wca/FormBuilder/input/FormInputs';
import ConditionalSection from './ConditionalSection';
import { useFormObject } from '../../wca/FormBuilder/provider/FormObjectProvider';

export default function RegistrationDropdown() {
  const { registration } = useFormObject();

  if (!registration) return null;

  const dropdownEnabled = !!registration.dropdownEnabled;

  return (
    <>
      <InputBooleanSelect id="dropdownEnabled" required />
      <ConditionalSection showIf={dropdownEnabled}>
        <InputString
          id="dropdownTitle"
          required={false}
        />
        <InputTextArea
          id="dropdownOptions"
          required={dropdownEnabled}
        />
        <InputBoolean id="dropdownRequired" />
      </ConditionalSection>
    </>
  );
}
