import React from 'react';
import { Form, Label } from 'semantic-ui-react';

const QualificationResultTypeOptions = [
  { key: 0, value: 0, text: 'No qualification' },
  {
    key: -1, value: -1, text: '────────', disabled: true,
  },
  { key: 1, value: 'single', text: 'Single' },
  { key: 2, value: 'average', text: 'Average' },
];

export function qualificationResultTypeInput({
  qualificationResultType, onChange,
}) {
  return (
    <Form.Select
      value={qualificationResultType}
      onChange={onChange}
      options={QualificationResultTypeOptions}
      openOnFocus={false}
    />
  );
}

export default function qualificationResultTypeField({
  qualificationResultType, onChange,
}) {
  return (
    <Form.Field inline>
      <Form.Input
        as={qualificationResultTypeInput}
        qualificationResultType={qualificationResultType}
        onChange={onChange}
      />
      <Label pointing>
        Result Type
      </Label>
    </Form.Field>
  );
}
