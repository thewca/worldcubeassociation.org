import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { Button, Header, Segment } from 'semantic-ui-react';
import runValidatorsForCompetitionList from '../../../Panel/pages/RunValidatorsPage/api/runValidatorsForCompetitionList';
import { ALL_VALIDATORS, ticketsCompetitionResultStatuses } from '../../../../lib/wca-data.js.erb';
import ValidationOutput from '../../../Panel/pages/RunValidatorsPage/ValidationOutput';

export default function WarningsVerification({ ticketDetails, updateStatus }) {
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
      <Segment>{ticketDetails.ticket.metadata.delegate_message}</Segment>
      <Button
        primary
        onClick={() => updateStatus(ticketsCompetitionResultStatuses.warnings_verified)}
      >
        Warnings verified
      </Button>
    </>
  );
}
