import React from 'react';
import { InputString } from '../Inputs/FormInputs';
import { useStore } from '../../../lib/providers/StoreProvider';

export default function NameDetails() {
  const { status: { isPersisted } } = useStore();

  return (
    <>
      {isPersisted && <InputString id="id" />}
      <InputString id="name" />
      {isPersisted && <InputString id="shortName" />}
      <InputString id="nameReason" mdHint />
    </>
  );
}
