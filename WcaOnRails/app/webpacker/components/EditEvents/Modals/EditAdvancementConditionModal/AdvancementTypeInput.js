import React from 'react';
import { Form, Label } from 'semantic-ui-react';

const AdvancementTypeOptions = [
  { key: 0, value: 0, text: 'To be Announced' },
  {
    key: -1, value: -1, text: '────────', disabled: true,
  },
  { key: 1, value: 'ranking', text: 'Ranking' },
  { key: 2, value: 'percent', text: 'Percent' },
  { key: 3, value: 'attemptResult', text: 'Result' },
];

export function AdvancementTypeInput({
  advancementType, onChange,
}) {
  return (
    <Form.Select
      value={advancementType}
      onChange={onChange}
      options={AdvancementTypeOptions}
      openOnFocus={false}
      name="advancementType"
    />
  );
}

export default function AdvancementTypeField({
  advancementType, onChange,
}) {
  return (
    <Form.Field inline>
      <Form.Input
        as={AdvancementTypeInput}
        advancementType={advancementType}
        onChange={onChange}
      />
      <Label pointing>
        Type
      </Label>
    </Form.Field>
  );
}
