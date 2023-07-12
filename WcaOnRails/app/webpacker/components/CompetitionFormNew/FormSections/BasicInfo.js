import React from 'react';
import { Form } from 'semantic-ui-react';
import { InputString } from '../Inputs/BasicInputs';

export default function BasicInfo() {
  return (
    <Form>
      <InputString id="id" />
      <InputString id="name" />
      <InputString id="cellName" />
      <InputString id="name_reason" mdHint />
    </Form>
  );
}
