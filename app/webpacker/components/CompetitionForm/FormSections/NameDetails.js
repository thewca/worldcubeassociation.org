import React from 'react';
import { InputString } from '../../wca/FormProvider/input/FormInputs';
import { useStore } from '../../../lib/providers/StoreProvider';
import { competitionMaxShortNameLength } from '../../../lib/wca-data.js.erb';
import { useFormObject } from '../../wca/FormProvider/provider/FormObjectProvider';

export default function NameDetails() {
  const { isPersisted, isAdminView } = useStore();

  const { name } = useFormObject();

  const nameAlreadyShort = !name || name.length <= competitionMaxShortNameLength;
  const disableIdAndShortName = !isAdminView && nameAlreadyShort;

  return (
    <>
      {isPersisted && <InputString id="competitionId" disabled={disableIdAndShortName} />}
      <InputString id="name" required />
      {isPersisted && <InputString id="shortName" disabled={disableIdAndShortName} />}
      <InputString id="nameReason" mdHint required />
    </>
  );
}
