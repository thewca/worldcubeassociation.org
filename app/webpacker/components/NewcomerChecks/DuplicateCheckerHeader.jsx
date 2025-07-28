import React, { useMemo } from 'react';
import { DateTime } from 'luxon';
import { Button, Message } from 'semantic-ui-react';
import { duplicateCheckerJobRunStatuses } from '../../lib/wca-data.js.erb';

// As per the specification of server while writing this comment, for each
// server, it will take approx 2 seconds. The number of newcomers will be
// usually 150 in very big competitions. It can go up as well. Considering 150,
// the time taken will be around 5 minutes. I'm ignoring the uncertainties and
// expecting that number of newcomers will get doubled over next few years. So
// defining the delay as 10 minutes.
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
