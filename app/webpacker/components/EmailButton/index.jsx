import React from 'react';
import {
  Button, Icon, ButtonContent, Label,
} from 'semantic-ui-react';

export default function EmailButton({ email }) {
  return (
    <Button as="div" labelPosition="right">
      <Button animated="vertical">
        <ButtonContent hidden>
          <Icon name="copy" />
        </ButtonContent>
        <ButtonContent visible>
          <Icon name="mail" />
        </ButtonContent>
      </Button>
      <Label as="a" basic pointing="left" href={`mailto:${email}`}>
        {email}
      </Label>
    </Button>
  );
}
