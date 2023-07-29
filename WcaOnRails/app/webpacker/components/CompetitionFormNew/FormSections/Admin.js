import React, { useContext } from 'react';
import SubSection from './SubSection';
import { InputBoolean } from '../Inputs/FormInputs';
import FormContext from '../State/FormContext';

export default function Admin() {
  const { persisted, adminView } = useContext(FormContext);
  console.log({
    persisted,
    adminView,
  });

  if (!persisted || !adminView) return null;

  return (
    <SubSection section="admin">
      <InputBoolean id="confirmed" />
      <InputBoolean id="showAtAll" />
    </SubSection>
  );
}
