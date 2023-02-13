import React from 'react';
import { Form, Label } from 'semantic-ui-react';
import i18n from '../../../../lib/i18n';

const QualificationResultTypeOptions = [
  { key: 0, value: 0, text: i18n.t('qualification.type.none') },
  {
    key: -1, value: -1, text: '────────', disabled: true,
  },
  { key: 1, value: 'single', text: i18n.t('common.single') },
  { key: 2, value: 'average', text: i18n.t('common.average') },
];
const MbfQualificationResultTypeOptions = QualificationResultTypeOptions.slice(0, 3);

export function qualificationResultTypeInput({
  qualificationResultType, onChange, eventId,
}) {
  return (
    <Form.Select
      name="qualificationResultType"
      value={qualificationResultType}
      onChange={onChange}
      options={
        eventId === '333mbf'
          ? MbfQualificationResultTypeOptions
          : QualificationResultTypeOptions
      }
      openOnFocus={false}
    />
  );
}

export default function qualificationResultTypeField({
  qualificationResultType, onChange, eventId,
}) {
  return (
    <Form.Field inline>
      <Label>
        {i18n.t('qualification.result_type')}
      </Label>
      <Form.Input
        as={qualificationResultTypeInput}
        qualificationResultType={qualificationResultType}
        onChange={onChange}
        eventId={eventId}
      />
    </Form.Field>
  );
}
