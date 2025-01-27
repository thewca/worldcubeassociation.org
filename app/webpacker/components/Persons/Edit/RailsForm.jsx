import { Form } from 'semantic-ui-react';
import React from 'react';

export default function RailsForm({ method, action, children }) {
  return (
    <Form action={action} method="POST">
      <input
        type="hidden"
        name="authenticity_token"
        value={document.querySelector('meta[name=csrf-token]').content}
      />
      <input type="hidden" name="_method" value={method} />
      {children}
    </Form>
  );
}
