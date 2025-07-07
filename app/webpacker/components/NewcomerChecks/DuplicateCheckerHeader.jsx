import React from 'react';
import { DateTime } from 'luxon';
import { Button, Message } from 'semantic-ui-react';
import { duplicateCheckerJobRunStatuses } from '../../lib/wca-data.js.erb';

export default function DuplicateCheckerHeader({ lastDuplicateCheckerJobRun, run }) {
  if (
    lastDuplicateCheckerJobRun.run_status === duplicateCheckerJobRunStatuses.in_progress
    || lastDuplicateCheckerJobRun.run_status === duplicateCheckerJobRunStatuses.not_started
  ) {
    return (
      <Message info>
        Duplicate Checker is currently running. Please check after sometime.
      </Message>
    );
  } if (lastDuplicateCheckerJobRun.run_status === duplicateCheckerJobRunStatuses.success) {
    return (
      <Message positive>
        {`Duplicate Checker ran successfully at ${
          DateTime.fromISO(lastDuplicateCheckerJobRun.end_time).toLocal().toRelative()}.`}
        <Button onClick={run}>Re-run now</Button>
      </Message>
    );
  } if (lastDuplicateCheckerJobRun.run_status === duplicateCheckerJobRunStatuses.failed) {
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
