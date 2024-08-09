import React from 'react';
import {
  Form,
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
        {competitionInfo.payment_information ? <Markdown md={competitionInfo.payment_information} /> : i18n.t('registrations.wont_pay_here') }
        <br />
        <Form.Button type="submit">I have paid</Form.Button>
      </Form>
    </Segment>
  );
}
