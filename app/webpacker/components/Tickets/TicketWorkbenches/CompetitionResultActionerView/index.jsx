import React from 'react';
import { DateTime } from 'luxon';
import { useQuery } from '@tanstack/react-query';
import { ticketsCompetitionResultStatuses } from '../../../../lib/wca-data.js.erb';
import WarningsVerification from './WarningsVerification';
import TimelineView from './TimelineView';
import { MergeInboxResults, MergeInboxScrambles } from './MergeInboxResultsData';
import VerifyNewcomers from './VerifyNewcomers';
import CreateWcaIds from './CreateWcaIds';
import FinalSteps from './FinalSteps';
import MiscActions from './MiscActions';
import I18n from '../../../../lib/i18n';
import getUnfinishedPersons from '../../api/competitionResult/getUnfinishedPersons';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';

export default function CompetitionResultActionerView({ ticketDetails, currentStakeholder }) {
  const { ticket: { metadata: { status, competition: { id: competitionId } } } } = ticketDetails;

  const {
    data: unfinishedPersons,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ['unfinished-persons', competitionId],
    queryFn: () => getUnfinishedPersons({
      competitionId,
    }),
    enabled: !!competitionId && [
      ticketsCompetitionResultStatuses.merged_inbox_scrambles,
      ticketsCompetitionResultStatuses.newcomers_verified,
    ].includes(status),
  });

  if (isFetching) return <Loading />;
  if (isError) return <Errored error={error} />;

  return (
    <>
      <TimelineView status={status} />
      <ViewForStatus
        status={status}
        ticketDetails={ticketDetails}
        currentStakeholder={currentStakeholder}
        unfinishedPersons={unfinishedPersons}
      />
      <MiscActions
        ticketDetails={ticketDetails}
      />
    </>
  );
}

function ViewForStatus({
  status,
  ticketDetails,
  currentStakeholder,
  unfinishedPersons,
}) {
  const {
    ticket: {
      metadata: {
        competition: { results_posted_at: resultsPostedAt, posted_user: postedUser },
      },
    },
  } = ticketDetails;

  const hasUnfinishedPersons = (
    unfinishedPersons?.persons_to_finish && unfinishedPersons.persons_to_finish.length > 0
  );

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
        <MergeInboxScrambles
          ticketDetails={ticketDetails}
          currentStakeholder={currentStakeholder}
        />
      );

    case ticketsCompetitionResultStatuses.merged_inbox_scrambles:
      if (!hasUnfinishedPersons) {
        return (
          <FinalSteps
            ticketDetails={ticketDetails}
          />
        );
      }
      return (
        <VerifyNewcomers
          ticketDetails={ticketDetails}
          currentStakeholder={currentStakeholder}
        />
      );

    case ticketsCompetitionResultStatuses.newcomers_verified:
      if (!hasUnfinishedPersons) {
        return (
          <FinalSteps
            ticketDetails={ticketDetails}
          />
        );
      }
      return (
        <CreateWcaIds
          ticketDetails={ticketDetails}
          currentStakeholder={currentStakeholder}
          unfinishedPersons={unfinishedPersons}
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
