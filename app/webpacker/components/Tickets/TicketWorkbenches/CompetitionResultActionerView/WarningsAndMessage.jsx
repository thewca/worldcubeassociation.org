import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header, Segment } from 'semantic-ui-react';
import ValidationOutput from '../../../Panel/pages/RunValidatorsPage/ValidationOutput';
import runValidatorsForCompetitionList from '../../../Panel/pages/RunValidatorsPage/api/runValidatorsForCompetitionList';
import { ALL_VALIDATORS } from '../../../../lib/wca-data.js.erb';
import Markdown from '../../../Markdown';

export default function WarningsAndMessage({ ticketDetails }) {
  const { ticket: { id, metadata } } = ticketDetails;
  const {
    data: validationOutput, isPending, isError, error,
  } = useQuery({
    queryKey: ['ticketCompetitionResultValidationOutput', id],
    queryFn: () => runValidatorsForCompetitionList(
      metadata.competition_id,
      ALL_VALIDATORS,
      false,
      false,
    ),
  });

  return (
    <>
      <ValidationOutput
        validationOutput={validationOutput}
        isPending={isPending}
        isError={isError}
        error={error}
      />
      <Header>Delegate&apos;s message</Header>
      <Segment>
        <Markdown md={ticketDetails.ticket.metadata.delegate_message} id={`delegate-message-${id}`} />
      </Segment>
    </>
  );
}
