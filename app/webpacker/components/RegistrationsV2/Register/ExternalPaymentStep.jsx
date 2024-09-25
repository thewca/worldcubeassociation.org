import React from 'react';
import {
  Form, Header, Message,
  Segment,
} from 'semantic-ui-react';
import Markdown from '../../Markdown';
import i18n from '../../../lib/i18n';
import useCheckboxState from '../../../lib/hooks/useCheckboxState';

export default function ExternalPaymentStep({
  competitionInfo,
  nextStep,
  refetchRegistration,
}) {
  const [paymentAcknowledged, setPaymentAcknowledged] = useCheckboxState(false);
  return (
    <Segment>
      <Form onSubmit={async () => {
        // We manually refetch here because we only want to show the external payment panel once
        await refetchRegistration();
        nextStep();
      }}
      >
        <Header> External Payments </Header>
        <Form.Field>{competitionInfo.payment_information ? <Markdown md={competitionInfo.payment_information} /> : <Header.Subheader>{i18n.t('registrations.wont_pay_here')}</Header.Subheader> }</Form.Field>
        <Message positive>
          <Form.Checkbox
            checked={paymentAcknowledged}
            onClick={setPaymentAcknowledged}
            label={i18n.t('competitions.registration_v2.list.payment.external_acknowledgement')}
            required
          />
        </Message>
        <Form.Button type="submit" positive>Next</Form.Button>
      </Form>
    </Segment>
  );
}
