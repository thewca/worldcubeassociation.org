import React from 'react';
import { Message } from 'semantic-ui-react';
import { useQuery } from '@tanstack/react-query';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';
import I18n from '../../../../lib/i18n';
import getEditPersonValidators from '../../api/editPerson/getEditPersonValidators';

export default function EditPersonValidations({ ticketDetails }) {
  const { ticket } = ticketDetails;
  const { data: validators, isLoading, isError } = useQuery({
    queryKey: ['ticket-edit-person-validators', ticket.id],
    queryFn: () => getEditPersonValidators({ ticketId: ticket.id }),
  });

  if (isLoading) return <Loading />;
  if (isError) return <Errored />;

  return [
    ...validators.name,
    ...validators.dob,
  ].map((validator) => (
    <Message warning>
      {I18n.t(`validators.${validator.kind}.${validator.id}`, validator.args)}
    </Message>
  ));
}
