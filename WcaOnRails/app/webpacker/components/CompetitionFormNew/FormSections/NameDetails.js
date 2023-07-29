import React, { useContext } from 'react';
import { InputString } from '../Inputs/FormInputs';
import FormContext from '../State/FormContext';

export default function NameDetails() {
  const { persisted } = useContext(FormContext);

  return (
    <>
      {persisted && <InputString id="id" />}
      <InputString id="name" />
      {persisted && <InputString id="cellName" />}
      <InputString id="name_reason" mdHint />
    </>
  );
}
