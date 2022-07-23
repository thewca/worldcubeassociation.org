import React from 'react';
import { Form, Label } from 'semantic-ui-react';

const QualificationTypeOptions = [
  { key: 1, value: 'attemptResult', text: 'By Result' },
  { key: 2, value: 'ranking', text: 'Top N' },
  { key: 2, value: 'anyResult', text: 'Any Result' },
];

export function qualificationTypeInput({
  qualificationType, onChange,
}) {
  return (
    <Form.Select
      value={qualificationType}
      onChange={onChange}
      options={QualificationTypeOptions}
      openOnFocus={false}
    />
  );
}

export default function qualificationTypeField({
  qualificationType, onChange,
}) {
  return (
    <Form.Field inline>
      <Form.Input
        as={qualificationTypeInput}
        qualificationType={qualificationType}
        onChange={onChange}
      />
      <Label pointing>
        Qualificiation Type
      </Label>
    </Form.Field>
  );
}
