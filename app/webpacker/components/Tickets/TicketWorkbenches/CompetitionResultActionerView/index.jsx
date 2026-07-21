import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ticketsCompetitionResultStatuses } from '../../../../lib/wca-data.js.erb';
import TimelineView from './TimelineView';
import MiscActions from './MiscActions';
import getUnfinishedPersons from '../../api/competitionResult/getUnfinishedPersons';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';
import { TIMELINE_ORDER, TIMELINE_STATUSES, ResultsPostedMessage } from './TimelineStatuses';

function getNextStatus(status, hasUnfinishedPersons) {
  const currentIndex = TIMELINE_ORDER.indexOf(status);
  if (currentIndex === -1 || currentIndex + 1 >= TIMELINE_ORDER.length) {
    return null;
  }

  const nextStatus = TIMELINE_ORDER[currentIndex + 1];

  if (!hasUnfinishedPersons) {
    // If there are no newcomers to process, we can skip the newcomer verification
    // and WCA ID creation steps and jump straight to Final Steps (posted).
    if (
      nextStatus === ticketsCompetitionResultStatuses.newcomers_verified
      || nextStatus === ticketsCompetitionResultStatuses.created_wca_ids
    ) {
      return ticketsCompetitionResultStatuses.posted;
    }
  }
  return nextStatus;
}

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

  const hasUnfinishedPersons = (
    unfinishedPersons?.persons_to_finish && unfinishedPersons.persons_to_finish.length > 0
  );

  const nextStatus = getNextStatus(status, hasUnfinishedPersons);

  return (
    <>
      <TimelineView nextStatus={nextStatus} />
      <ViewForStatus
        nextStatus={nextStatus}
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
  nextStatus,
  ticketDetails,
  currentStakeholder,
  unfinishedPersons,
}) {
  if (nextStatus === null) {
    return <ResultsPostedMessage ticketDetails={ticketDetails} />;
  }

  const statusConfig = TIMELINE_STATUSES[nextStatus];
  if (statusConfig && statusConfig.Component) {
    const { Component } = statusConfig;
    return (
      <Component
        ticketDetails={ticketDetails}
        currentStakeholder={currentStakeholder}
        unfinishedPersons={unfinishedPersons}
      />
    );
  }

  return null;
}
