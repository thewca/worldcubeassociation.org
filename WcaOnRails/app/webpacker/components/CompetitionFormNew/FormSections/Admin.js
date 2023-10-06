import React from 'react';
import SubSection from './SubSection';
import { InputBoolean } from '../Inputs/FormInputs';
import { useStore } from '../../../lib/providers/StoreProvider';

export default function Admin() {
  const { persisted, adminView } = useStore();

  if (!persisted || !adminView) return null;

  return (
    <SubSection section="admin">
      <InputBoolean id="confirmed" />
      <InputBoolean id="showAtAll" />
    </SubSection>
  );
}
