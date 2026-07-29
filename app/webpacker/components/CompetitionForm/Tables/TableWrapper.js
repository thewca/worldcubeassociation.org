import React from 'react';
import { Form } from 'semantic-ui-react';

export default function TableWrapper({ label, children }) {
  return (
    <Form.Field>
      {/* eslint-disable-next-line react/no-danger, jsx-a11y/label-has-associated-control */}
      <label dangerouslySetInnerHTML={{ __html: label }} />
      {children}
    </Form.Field>
  );
}
