import React, { useMemo } from 'react';
import { DateTime } from 'luxon';
import { Button, Message } from 'semantic-ui-react';
import { duplicateCheckerJobRunStatuses } from '../../lib/wca-data.js.erb';

// Usually this job should run in less than 5 minutes in most of the cases. It
// can increase sometimes. A safe definition of "delay" looks like 10 minutes.
const JOB_RUN_DELAY_MINUTES = 10;

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
        Job running longer than expected. Click &apos;Retry&apos; if it appears stuck.
        <Button onClick={run}>Retry</Button>
      </Message>
    );
  }

  if (lastDuplicateCheckerJobRun.run_status === duplicateCheckerJobRunStatuses.not_started) {
    return (
      <Message info>
        Duplicate Checker will start soon. Please check after sometime.
        <Button onClick={refetch}>Refresh</Button>
      </Message>
    );
  }

  if (lastDuplicateCheckerJobRun.run_status === duplicateCheckerJobRunStatuses.in_progress) {
    return (
      <Message info>
        Duplicate Checker is currently running. Please check after sometime.
        <Button onClick={refetch}>Refresh</Button>
      </Message>
    );
  }

  if (lastDuplicateCheckerJobRun.run_status === duplicateCheckerJobRunStatuses.success) {
    return (
      <Message positive>
        {`Duplicate Checker ran successfully at ${
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
