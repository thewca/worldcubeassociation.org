import React from 'react';
import { ticketsCompetitionResultStatuses } from '../../../../lib/wca-data.js.erb';
import WarningsVerification from './WarningsVerification';
import { adminImportResultsUrl } from '../../../../lib/requests/routes.js.erb';
import TimelineView from './TimelineView';
import MergeTemporaryResults from './MergeTemporaryResults';

export default function CompetitionResultActionerView({ ticketDetails, updateStatus }) {
  const { ticket: { metadata: { status, competition_id: competitionId } } } = ticketDetails;

  return (
    <>
      <TimelineView status={status} />
      <ViewForStatus
        status={status}
        ticketDetails={ticketDetails}
        updateStatus={updateStatus}
        competitionId={competitionId}
      />
    </>
  );
}

function ViewForStatus({
  status, ticketDetails, updateStatus, competitionId,
}) {
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
        <MergeTemporaryResults
          ticketDetails={ticketDetails}
        />
      );

    case ticketsCompetitionResultStatuses.merged_temporary_results:
      return (
        <p>
          Please finish the remaining steps in
          {' '}
          <a href={adminImportResultsUrl(competitionId)}>import results page</a>
          .
        </p>
      );

    default:
      return null;
  }
}
