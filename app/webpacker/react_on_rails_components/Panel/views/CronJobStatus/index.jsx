import React from 'react';
import {
  Button, Header, Message, Segment,
} from 'semantic-ui-react';
import { useQuery } from '@tanstack/react-query';
import { DateTime } from 'luxon';
import getCronjobDetails from './api/getCronjobDetails';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';
import CronjobActions from './CronjobActions';

const STEPS_INVOLVED = {
  ComputeAuxiliaryData: [
    'Computes some auxiliary tables in the database (ConciseSingleResults, ConciseAverageResults, RanksSingle and RanksAverage).',
    'Computes the lookup for assigning record markers.',
    'Deletes cached results (so they can be cached again).',
  ],
  DumpDeveloperDatabase: [
    'Copies a redacted version of our entire database into an SQL file.',
    'Zips the file and makes the ZIP file available for public download.',
  ],
  DumpPublicResultsDatabase: [
    'Generates the public Results Export in SQL and TSV formats.',
    'Zips the file and makes the ZIP file available for public download.',
  ],
};

const timeSince = (timestamp) => (DateTime.fromISO(timestamp).toLocal().toRelative());

const timeDuration = (timestamp1, timestamp2) => (
  DateTime.fromISO(timestamp2).diff(DateTime.fromISO(timestamp1)).rescale().toHuman());

function getCronjobMessage(cronjobDetails) {
  const isScheduled = !!cronjobDetails.enqueued_at;
  const isInProgress = cronjobDetails.run_start && !cronjobDetails.run_end;
  const isFinished = !!cronjobDetails.run_end;

  if (isScheduled) {
    return [
      `The job has been scheduled ${timeSince(cronjobDetails.enqueued_at)}, but it hasn't been picked up by the job handler yet. Please come back later.`,
      'info',
    ];
  }

  if (isInProgress) {
    if (cronjobDetails.recently_errored) {
      return [
        `The job started to run but crashed :O The error message was: ${cronjobDetails.last_error_message}`,
        'error',
      ];
    }

    return [
      'The job is running. Thanks for checking =)',
      'info',
    ];
  }

  if (isFinished) {
    if (cronjobDetails.last_run_successful) {
      return [
        `Job was last completed ${timeSince(cronjobDetails.run_end)} and took ${timeDuration(cronjobDetails.run_start, cronjobDetails.run_end)}.`,
        'success',
      ];
    }
    return [
      `Job was last completed ${timeSince(cronjobDetails.run_end)} but it raised an error: ${cronjobDetails.last_error_message}. Note that our job handler has an automatic retry mechanism. The more times a job fails, the longer it waits to try again. If this problem persists for several hours, feel free to contact the Software Team.`,
      'error',
    ];
  }

  return [
    'Oh dear! The job has never been run!',
    'error',
  ];
}

export default function CronjobStatus({ cronjobName }) {
  const {
    data: cronjobDetails, isFetching, isError, refetch,
  } = useQuery({
    queryKey: ['cronjob-details', cronjobName],
    queryFn: () => getCronjobDetails({ cronjobName }),
  });

  if (isFetching) return <Loading />;
  if (isError) return <Errored />;

  const [cronjobMessage, cronjobMessageType] = getCronjobMessage(cronjobDetails);

  return (
    <>
      <Header>{`Controls for ${cronjobName}`}</Header>
      <Button primary onClick={refetch}>Refresh</Button>
      <p>Steps involved in this cronjob:</p>
      <Segment.Group>
        {STEPS_INVOLVED[cronjobName].map((step) => (
          <Segment key={step}>{step}</Segment>
        ))}
      </Segment.Group>
      <Message
        warning={cronjobMessageType === 'warning'}
        info={cronjobMessageType === 'info'}
        error={cronjobMessageType === 'error'}
        success={cronjobMessageType === 'success'}
      >
        {cronjobMessage}
      </Message>
      <CronjobActions
        cronjobName={cronjobName}
        cronjobDetails={cronjobDetails}
      />
    </>
  );
}
