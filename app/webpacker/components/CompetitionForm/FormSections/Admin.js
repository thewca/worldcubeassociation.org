import React from 'react';
import { InputBoolean, InputSelect } from '../../wca/FormBuilder/input/FormInputs';
import { useStore } from '../../../lib/providers/StoreProvider';
import SubSection from '../../wca/FormBuilder/SubSection';
import { useFormObject } from "../../wca/FormBuilder/provider/FormObjectProvider";

const registrationVersions = [{
  key: 'v1', value: 'v1', text: 'Version 1',
},{
  key: 'v2', value: 'v2', text: 'Version 2',
}];

export default function Admin() {
  const { isAdminView, isPersisted, canChangeRegistrationSystem } = useStore();
  const { admin: { registrationVersion } } = useFormObject();
  if (!isPersisted || !isAdminView) return null;

  return (
    <SubSection section="admin">
      <InputBoolean id="isConfirmed" />
      <InputBoolean id="isVisible" />
      <InputSelect id="registrationVersion" options={registrationVersions} value={registrationVersions.find((x) => x.value === registrationVersion)} disabled={!canChangeRegistrationSystem} />
    </SubSection>
  );
}
