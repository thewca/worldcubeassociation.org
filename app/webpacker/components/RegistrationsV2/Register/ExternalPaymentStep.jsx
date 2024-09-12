import React from 'react';
import {
  Form, Header,
  Segment,
} from 'semantic-ui-react';
import Markdown from '../../Markdown';
import i18n from '../../../lib/i18n';

export default function ExternalPaymentStep({
  competitionInfo,
  nextStep,
}) {
  return (
    <Segment>
      <Form onSubmit={nextStep}>
        {competitionInfo.payment_information ? <Markdown md={competitionInfo.payment_information} /> : <Header>{i18n.t('registrations.wont_pay_here')}</Header> }
        <Form.Button type="submit">I have paid</Form.Button>
      </Form>
    </Segment>
  );
}
