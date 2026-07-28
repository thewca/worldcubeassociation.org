import React, { useState } from 'react';
import {
  Accordion, Icon, List, Message,
} from 'semantic-ui-react';
import I18n from '../../../lib/i18n';

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

  return (
    <List.List>
      {Object.keys(errors).map((attribute) => {
        const attrErrors = errors[attribute];

        if (nestedErrorCount(attrErrors) === 0) return null;

        return (
          <List.Item key={`${nestingKey}.${attribute}`}>
            <List.Content>
              <List.Header>{humanize(attribute)}</List.Header>
              <List.Description>
                <NestedErrorList errors={attrErrors} nestedKeys={nestedKeys.concat(attribute)} />
              </List.Description>
            </List.Content>
          </List.Item>
        );
      })}
    </List.List>
  );
}

export default function FormErrors({ errors }) {
  const [accordionIsOpen, setAccordionIsOpen] = useState(true);

  if (!errors) return null;

  return (
    <Message negative>
      <Accordion>
        <Accordion.Title
          active={accordionIsOpen}
          onClick={() => setAccordionIsOpen((isOpen) => !isOpen)}
        >
          <Icon name="dropdown" />
          {I18n.t('wca.errors.messages.form_error', { count: nestedErrorCount(errors) })}
        </Accordion.Title>
        <Accordion.Content active={accordionIsOpen}>
          <List bulleted>
            <NestedErrorList errors={errors} />
          </List>
        </Accordion.Content>
      </Accordion>
    </Message>
  );
}
