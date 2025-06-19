import React from 'react';
import { DateTime } from 'luxon';
import { Button, Message } from 'semantic-ui-react';
import { duplicateCheckerJobStatuses } from '../../lib/wca-data.js.erb';

export default function DuplicateCheckerHeader({ lastDuplicateCheckerJob, run }) {
  if (
    lastDuplicateCheckerJob.status === duplicateCheckerJobStatuses.in_progress
    || lastDuplicateCheckerJob.status === duplicateCheckerJobStatuses.not_started
  ) {
    return (
      <Message info>
        Duplicate Checker is currently running. Please check after sometime.
      </Message>
    );
  } if (lastDuplicateCheckerJob.status === duplicateCheckerJobStatuses.success) {
    return (
      <Message positive>
        {`Duplicate Checker ran successfully at ${
          DateTime.fromISO(lastDuplicateCheckerJob.end_time).toLocal().toRelative()}.`}
        <Button onClick={run}>Re-run now</Button>
      </Message>
    );
  } if (lastDuplicateCheckerJob.status === duplicateCheckerJobStatuses.failed) {
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
