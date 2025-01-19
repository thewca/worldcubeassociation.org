import React from 'react';
import { List, Message } from 'semantic-ui-react';

const anonymizationType = (data) => {
  if (data.user_details && !data.person_details) {
    return 'Account Only';
  } if (data.person_details && !data.user_details) {
    return 'Profile Only';
  } if (data.user_details && data.person_details) {
    return 'Account & Profile';
  }
  return 'Unknown';
};

export default function VerifyAnonymizeDetails({ data }) {
  return (
    <List bulleted>
      <List.Item>{`Anonymization type: ${anonymizationType(data)}`}</List.Item>
      <List.Item>{`DOB: ${data.user_details?.dob || data.person_details?.dob}`}</List.Item>
      <List.Item>{`Email: ${data.user_details?.email || 'N/A'}`}</List.Item>
      <Message>
        Before processing any anonymization requests, WRT must receive verification with a
        picture/copy of an official ID verification (passport, driver&apos;s license, etc.) with a
        minimum of their name and birthday (any other information may be blurred-out/obfuscated).
      </Message>
    </List>
  );
}
