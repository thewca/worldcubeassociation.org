import React from 'react';
import { Form, Label } from 'semantic-ui-react';
import i18n from '../../../../lib/i18n';

const QualificationResultTypeOptions = [
  { key: 0, value: 0, text: i18n.t('qualification.type.none') },
  {
    key: -1, value: -1, text: '────────', disabled: true,
  },
  { key: 1, value: 'single', text: i18n.t('qualification.type.single') },
  { key: 2, value: 'average', text: i18n.t('qualification.type.average') },
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
