import React from 'react';
import { Header, List } from 'semantic-ui-react';

const nominationForm = 'https://docs.google.com/forms/d/e/1FAIpQLSfji_fOKEKcqS1Fb9fpu3qsBx-O8LiSJu_fG0TU7DJnR9Yj8g/viewform';
const promotionForm = 'https://docs.google.com/forms/d/e/1FAIpQLScq0JIOq1-2PHJoty5IE_uln_1Uq26Isp4mr3bqpfXKELQoqQ/viewform';
const demotionForm = 'https://docs.google.com/forms/d/e/1FAIpQLSf5BnccDL656ZPD3zl72Xgz7LmzLjFeTtjXKqvupo9Tn_VIRg/viewform';

export default function DelegateForms() {
  return (
    <>
      <Header as="h2">Delegate Forms</Header>
      <List>
        <List.Item>
          <a href={nominationForm} target="_blank" rel="noreferrer">Nomination Form</a>
        </List.Item>
        <List.Item>
          <a href={promotionForm} target="_blank" rel="noreferrer">Promotion Form</a>
        </List.Item>
        <List.Item>
          <a href={demotionForm} target="_blank" rel="noreferrer">Demotion Form</a>
        </List.Item>
      </List>
    </>
  );
}
