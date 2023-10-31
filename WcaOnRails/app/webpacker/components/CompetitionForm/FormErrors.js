import React from 'react';
import { List, Message } from 'semantic-ui-react';
import I18n from '../../lib/i18n';
import { useStore } from '../../lib/providers/StoreProvider';

// https://stackoverflow.com/questions/28336104/humanize-a-string-in-javascript
function humanize(str) {
  return str
    .replace(/^[\s_]+|[\s_]+$/g, '')
    .replace(/[_\s]+/g, ' ')
    .replace(/^[a-z]/, (m) => m.toUpperCase());
}

const nestedErrorCount = (errors) => {
  if (Array.isArray(errors)) {
    return errors.length;
  }

  if (!errors) return 0;

  return Object.values(errors).reduce((acc, attrErrors) => (acc + nestedErrorCount(attrErrors)), 0);
};

function NestedErrorList({
  errors,
  nestedKeys = [],
}) {
  if (!errors) return null;

  const nestingKey = nestedKeys.join('.');

  if (Array.isArray(errors)) {
    return (
      <List.List>
        {errors.map((error) => (
          <List.Item key={`${nestingKey}#${error}`}>
            {error}
          </List.Item>
        ))}
      </List.List>
    );
  }

  return Object.keys(errors).map((attribute) => {
    const attrErrors = errors[attribute];

    if (nestedErrorCount(attrErrors) === 0) return null;

    return (
      <List.Item key={`${nestingKey}.${attribute}`}>
        <List.Content>
          <List.Header>{humanize(attribute)}</List.Header>
          <NestedErrorList errors={attrErrors} nestedKeys={nestedKeys.concat(attribute)} />
        </List.Content>
      </List.Item>
    );
  });
}

export default function FormErrors() {
  const { errors } = useStore();

  if (!errors) return null;

  return (
    <Message negative>
      <Message.Header>
        {I18n.t('wca.errors.messages.form_error', { count: nestedErrorCount(errors) })}
      </Message.Header>
      <List bulleted>
        <NestedErrorList errors={errors} />
      </List>
    </Message>
  );
}
