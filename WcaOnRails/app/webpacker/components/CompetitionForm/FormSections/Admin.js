import React from 'react';
import SubSection from './SubSection';
import { InputBoolean } from '../Inputs/FormInputs';
import { useStore } from '../../../lib/providers/StoreProvider';

export default function Admin() {
  const { isAdminView, isPersisted } = useStore();

  if (!isPersisted || !isAdminView) return null;

  return (
    <SubSection section="admin">
      <InputBoolean id="isConfirmed" />
      <InputBoolean id="isVisible" />
    </SubSection>
  );
}
