import React from 'react';
import { ticketsCompetitionResultStatuses } from '../../../../lib/wca-data.js.erb';
import WarningsVerification from './WarningsVerification';
import TimelineView from './TimelineView';
import MergeInboxResults from './MergeInboxResults';
import CreateWcaIds from './CreateWcaIds';
import FinalSteps from './FinalSteps';

export default function CompetitionResultActionerView({ ticketDetails, updateStatus }) {
  const { ticket: { metadata: { status } } } = ticketDetails;

  return (
    <>
      <TimelineView status={status} />
      <ViewForStatus
        status={status}
        ticketDetails={ticketDetails}
        updateStatus={updateStatus}
      />
    </>
  );
}

function ViewForStatus({ status, ticketDetails, updateStatus }) {
  switch (status) {
    case ticketsCompetitionResultStatuses.submitted:
      return <p>Please lock the competition results from the Posting dashboard.</p>;

    case ticketsCompetitionResultStatuses.locked_for_posting:
      return (
        <WarningsVerification
          ticketDetails={ticketDetails}
          updateStatus={updateStatus}
        />
      );

    case ticketsCompetitionResultStatuses.warnings_verified:
      return (
        <MergeInboxResults
          ticketDetails={ticketDetails}
        />
      );

    case ticketsCompetitionResultStatuses.merged_inbox_results:
      return (
        <CreateWcaIds
          ticketDetails={ticketDetails}
        />
      );
    case ticketsCompetitionResultStatuses.created_wca_ids:
      return (
        <FinalSteps
          ticketDetails={ticketDetails}
        />
      );

    default:
      return null;
  }
}
