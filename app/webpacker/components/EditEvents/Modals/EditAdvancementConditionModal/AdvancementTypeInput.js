import React from 'react';
import { Form, Label } from 'semantic-ui-react';

const advancementTypeOptions = (roundNumber) => [
  { key: 0, value: 0, text: 'To be Announced' },
  {
    key: -1, value: -1, text: '────────', disabled: true,
  },
  {
    key: -2, value: 'dual', text: 'Dual Round', disabled: roundNumber !== 1,
  },
  { key: 1, value: 'ranking', text: 'Ranking' },
  { key: 2, value: 'percent', text: 'Percent' },
  { key: 3, value: 'attemptResult', text: 'Result' },
];

export function AdvancementTypeInput({
  advancementType, onChange, roundNumber,
}) {
  const options = advancementTypeOptions(roundNumber);

  return (
    <Form.Select
      value={advancementType}
      onChange={onChange}
      options={options}
      openOnFocus={false}
      name="advancementType"
    />
  );
}

export default function AdvancementTypeField({
  advancementType, onChange, roundNumber,
}) {
  return (
    <Form.Field inline>
      <Label>
        Type
      </Label>
      <Form.Input
        as={AdvancementTypeInput}
        advancementType={advancementType}
        onChange={onChange}
        roundNumber={roundNumber}
      />
    </Form.Field>
  );
}
