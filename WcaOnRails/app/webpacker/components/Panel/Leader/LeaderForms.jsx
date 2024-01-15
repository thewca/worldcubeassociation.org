import React from 'react';
import { Header, List } from 'semantic-ui-react';

const promotionForm = 'https://docs.google.com/forms/d/e/1FAIpQLSf3079GXcGUYDmJIIdRt0GPlDA_-aMSBZqk93zDgaFRxG15xQ/viewform';

export default function LeaderForms() {
  return (
    <>
      <Header as="h2">Delegate Forms</Header>
      <List>
        <List.Item>
          <a href={promotionForm} target="_blank" rel="noreferrer">Member Promotion Form</a>
        </List.Item>
      </List>
    </>
  );
}
