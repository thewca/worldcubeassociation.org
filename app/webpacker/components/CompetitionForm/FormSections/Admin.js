import React from 'react';
import { InputBoolean } from '../../wca/FormBuilder/input/FormInputs';
import { useStore } from '../../../lib/providers/StoreProvider';
import SubSection from '../../wca/FormBuilder/SubSection';

export default function Admin() {
  const { isAdminView, isPersisted, canChangeRegistrationSystem } = useStore();

  if (!isPersisted || !isAdminView) return null;

  return (
    <SubSection section="admin">
      <InputBoolean id="isConfirmed" />
      <InputBoolean id="isVisible" />
      { canChangeRegistrationSystem ? (
        <InputBoolean id="usesV2Registrations" />
      ) : (

      )}
    </SubSection>
  );
}
