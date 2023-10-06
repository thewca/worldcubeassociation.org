import React from 'react';
import { List, Message } from 'semantic-ui-react';
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
    <Message negative>
      <Message.Header>
        {I18n.t('wca.errors.messages.form_error', { count: Object.keys(errors).length })}
      </Message.Header>
      <List bulleted>
        {Object.keys(errors).map((attribute) => {
          const attributeErrors = errors[attribute];

          return attributeErrors.map((error) => (
            <List.Item key={attribute + error}>
              <List.Content>
                <List.Header>{humanize(attribute)}</List.Header>
                <List.Description>{error}</List.Description>
              </List.Content>
            </List.Item>
          ));
        })}
      </List>
    </Message>
  );
}
