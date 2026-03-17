import React, { useMemo } from 'react';
import { DateTime } from 'luxon';
import { Button, Message } from 'semantic-ui-react';
import { duplicateCheckerJobRunStatuses } from '../../lib/wca-data.js.erb';

// This is the average estimate runtime for a person as of July 2025.
const ESTIMATE_RUNTIME_SECONDS_PER_PERSON = 2;

// This is the approx number of newcomers in very big competitions as of July 2025.
const NEWCOMER_COUNT_THRESHOLD = 150;

// This is the number of minutes after which we consider the job to be delayed.
const JOB_RUN_DELAY_MINUTES = (NEWCOMER_COUNT_THRESHOLD * ESTIMATE_RUNTIME_SECONDS_PER_PERSON) / 60;

function isJobRunDelayed(lastDuplicateCheckerJobRun) {
  const jobNotStartedOrInProgress = (
    lastDuplicateCheckerJobRun.run_status === duplicateCheckerJobRunStatuses.not_started
    || lastDuplicateCheckerJobRun.run_status === duplicateCheckerJobRunStatuses.in_progress
  );

  return (jobNotStartedOrInProgress
    && DateTime.now().diff(
      DateTime.fromISO((lastDuplicateCheckerJobRun.start_time)),
    ).as('minutes') > JOB_RUN_DELAY_MINUTES
  );
}

export default function DuplicateCheckerHeader({
  lastDuplicateCheckerJobRun, run, refetch,
}) {
  const jobRunDelayed = useMemo(
    () => isJobRunDelayed(lastDuplicateCheckerJobRun),
    [lastDuplicateCheckerJobRun],
  );

  if (jobRunDelayed) {
    return (
      <Message warning>
        Job appears stuck, because it has been running longer than
        {' '}
        {JOB_RUN_DELAY_MINUTES}
        {' '}
        minutes. Click &quot;Retry&quot; below if you would like to cancel this job run and start
        a new check.
        Please note: If your competition has an unusually high number of newcomers (more than
        {' '}
        {NEWCOMER_COUNT_THRESHOLD}
        ), it may be possible that your job actually needs more time to run.
        Please use the button at your own discretion.
        <Button onClick={run}>Retry</Button>
      </Message>
    );
  }

  if (lastDuplicateCheckerJobRun.run_status === duplicateCheckerJobRunStatuses.not_started) {
    return (
      <Message info>
        The computation has been triggered, but we&apos;re waiting for free server capacity.
        {' '}
        Please check back later.
        <Button onClick={refetch}>Refresh</Button>
      </Message>
    );
  }

  if (lastDuplicateCheckerJobRun.run_status === duplicateCheckerJobRunStatuses.in_progress) {
    return (
      <Message info>
        Computing Duplicates right now, please check back later.
        <Button onClick={refetch}>Refresh</Button>
      </Message>
    );
  }

  if (lastDuplicateCheckerJobRun.run_status === duplicateCheckerJobRunStatuses.success) {
    return (
      <Message positive>
        {`Duplicate Checker ran successfully ${
          DateTime.fromISO(lastDuplicateCheckerJobRun.end_time).toLocal().toRelative()}.`}
        <Button onClick={run}>Re-run now</Button>
      </Message>
    );
  }

  if (lastDuplicateCheckerJobRun.run_status === duplicateCheckerJobRunStatuses.failed) {
    return (
      <Message negative>
        Something went wrong. Please try running again.
        <Button onClick={run}>Re-run now</Button>
      </Message>
    );
  }

  return (
    <Message positive>
      Duplicate Checker has not yet ran.
      <Button onClick={run}>Run now</Button>
    </Message>
  );
}
