import React from 'react';
import { InputBoolean, InputBooleanSelect, InputNumber } from '../../wca/FormBuilder/input/FormInputs';
import ConditionalSection from './ConditionalSection';
import { useStore } from '../../../lib/providers/StoreProvider';
import SubSection from '../../wca/FormBuilder/SubSection';
import { useFormObject } from '../../wca/FormBuilder/provider/FormObjectProvider';

export default function Admin() {
  const { admin } = useFormObject();
  const { isAdminView, isPersisted } = useStore();
  if (!isPersisted || !isAdminView) return null;

  return (
    <SubSection section="admin">
      <InputBoolean id="isConfirmed" />
      <InputBoolean id="isVisible" />
      <InputBooleanSelect id="autoAcceptEnabled" required />
      <ConditionalSection showIf={admin.autoAcceptEnabled}>
        <InputNumber id="autoAcceptDisableThreshold" />
      </ConditionalSection>
    </SubSection>
  );
}
