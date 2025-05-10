import React from 'react';
import { List, Message } from 'semantic-ui-react';

const anonymizationType = (data) => {
  if (data.user && !data.person) {
    return 'User Only';
  } if (data.person && !data.user) {
    return 'Person Only';
  } if (data.user && data.person) {
    return 'User & Person';
  }
  return 'Unknown';
};

export default function VerifyAnonymizeDetails({ data }) {
  return (
    <List bulleted>
      <List.Item>{`Anonymization type: ${anonymizationType(data)}`}</List.Item>
      <List.Item>{`DOB: ${data.user?.dob || data.person?.dob || 'N/A'}`}</List.Item>
      <List.Item>{`Email: ${data.user?.email || 'N/A'}`}</List.Item>
      <Message>
        Before processing any anonymization requests, WRT must receive verification with a
        picture/copy of an official ID verification (passport, driver&apos;s license, etc.) with a
        minimum of their name and birthday (any other information may be blurred-out/obfuscated).
      </Message>
    </List>
  );
}
