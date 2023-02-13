import React from 'react';
import { Form, Label } from 'semantic-ui-react';
import i18n from '../../../../lib/i18n';

const QualificationTypeOptions = [
  { key: '1', value: 'attemptResult', text: i18n.t('qualification.type.result') },
  { key: '2', value: 'ranking', text: i18n.t('qualification.type.ranking') },
  { key: '3', value: 'anyResult', text: i18n.t('qualification.type.any_result') },
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
      name="qualificationType"
    />
  );
}

export default function qualificationTypeField({
  qualificationType, onChange,
}) {
  return (
    <Form.Field inline>
      <Label>
        {i18n.t('qualification.type_label')}
      </Label>
      <Form.Input
        as={qualificationTypeInput}
        qualificationType={qualificationType}
        onChange={onChange}
      />
    </Form.Field>
  );
}
