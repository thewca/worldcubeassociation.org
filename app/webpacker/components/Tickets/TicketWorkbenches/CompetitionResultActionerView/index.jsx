import React from 'react';
import { ticketsCompetitionResultStatuses } from '../../../../lib/wca-data.js.erb';
import WarningsVerification from './WarningsVerification';
import TimelineView from './TimelineView';
import MergeInboxResults from './MergeInboxResults';
import CreateWcaIds from './CreateWcaIds';
import FinalSteps from './FinalSteps';
import MiscActions from './MiscActions';

export default function CompetitionResultActionerView({ ticketDetails, currentStakeholder }) {
  const { ticket: { metadata: { status } } } = ticketDetails;

  return (
    <>
      <TimelineView status={status} />
      <ViewForStatus
        status={status}
        ticketDetails={ticketDetails}
        currentStakeholder={currentStakeholder}
      />
      <MiscActions
        ticketDetails={ticketDetails}
      />
    </>
  );
}

function ViewForStatus({
  status, ticketDetails, currentStakeholder,
}) {
  switch (status) {
    case ticketsCompetitionResultStatuses.submitted:
      return <p>Please lock the competition results from the Posting dashboard.</p>;

    case ticketsCompetitionResultStatuses.locked_for_posting:
      return (
        <WarningsVerification
          ticketDetails={ticketDetails}
          currentStakeholder={currentStakeholder}
        />
      );

    case ticketsCompetitionResultStatuses.warnings_verified:
      return (
        <MergeInboxResults
          ticketDetails={ticketDetails}
          currentStakeholder={currentStakeholder}
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
