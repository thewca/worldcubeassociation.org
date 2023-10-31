import React from 'react';
import { InputString } from '../Inputs/FormInputs';
import { useStore } from '../../../lib/providers/StoreProvider';
import { competitionMaxShortNameLength } from '../../../lib/wca-data.js.erb';

export default function NameDetails() {
  const { competition: { name }, isPersisted, isAdminView } = useStore();

  const nameAlreadyShort = name.length <= competitionMaxShortNameLength;
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
