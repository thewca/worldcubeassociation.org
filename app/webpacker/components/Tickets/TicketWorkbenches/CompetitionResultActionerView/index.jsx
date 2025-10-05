import React from 'react';
import { DateTime } from 'luxon';
import { ticketsCompetitionResultStatuses } from '../../../../lib/wca-data.js.erb';
import WarningsVerification from './WarningsVerification';
import TimelineView from './TimelineView';
import MergeInboxResults from './MergeInboxResults';
import CreateWcaIds from './CreateWcaIds';
import FinalSteps from './FinalSteps';
import MiscActions from './MiscActions';
import I18n from '../../../../lib/i18n';

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
  const {
    ticket: {
      metadata: {
        competition: { results_posted_at: resultsPostedAt, posted_user: postedUser },
      },
    },
  } = ticketDetails;

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
    case ticketsCompetitionResultStatuses.posted:
      return (
        <>
          {I18n.t('competitions.results_posted_by_html', {
            poster_name: postedUser.name,
            date_time: DateTime.fromISO(resultsPostedAt).toLocaleString(DateTime.DATETIME_FULL),
          })}
        </>
      );

    default:
      return null;
  }
}
