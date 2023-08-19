import React from 'react';
import { Alert } from 'react-bootstrap';
import FormContext from './State/FormContext';
import I18n from '../../lib/i18n';

// https://stackoverflow.com/questions/28336104/humanize-a-string-in-javascript
function humanize(str) {
  return str
    .replace(/^[\s_]+|[\s_]+$/g, '')
    .replace(/[_\s]+/g, ' ')
    .replace(/^[a-z]/, (m) => m.toUpperCase());
}

export default function Errors() {
  const { errors } = React.useContext(FormContext);

  if (!errors) return null;

  return (
    <Alert bsStyle="danger">
      <p>
        {I18n.t('wca.errors.messages.form_error', { count: Object.keys(errors).length })}
      </p>
      <ul>
        {Object.keys(errors).map((attribute) => {
          const attributeErrors = errors[attribute];
          return attributeErrors.map((error) => (
            <li key={attribute + error}>
              <strong>{humanize(attribute)}</strong>
              {' '}
              {error}
            </li>
          ));
        })}
      </ul>
    </Alert>
  );
}
