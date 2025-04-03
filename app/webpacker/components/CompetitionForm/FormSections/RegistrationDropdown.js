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

  // Handle case where registration object doesn't have the dropdown fields yet
  if (!registration) return null;

  // Ensure we have default values for the dropdown fields
  const dropdownEnabled = registration.dropdownEnabled !== undefined ? registration.dropdownEnabled : false;

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
