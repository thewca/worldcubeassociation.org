import React from 'react';
import { InputString } from '../Inputs/FormInputs';
import { useStore } from '../../../lib/providers/StoreProvider';

export default function NameDetails() {
  const { persisted } = useStore();

  return (
    <>
      {persisted && <InputString id="id" />}
      <InputString id="name" />
      {persisted && <InputString id="cellName" />}
      <InputString id="name_reason" mdHint />
    </>
  );
}
