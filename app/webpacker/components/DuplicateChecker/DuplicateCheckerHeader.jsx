import { DateTime } from 'luxon';
import React from 'react';
import { Button, Message } from 'semantic-ui-react';
import { duplicateCheckerStatuses } from '../../lib/wca-data.js.erb';

export default function DuplicateCheckerHeader({
  lastFetchedStatus,
  lastFetchedTime,
  run,
}) {
  if (lastFetchedStatus === duplicateCheckerStatuses.not_fetched) {
    return (
      <Message positive>
        Duplicate Checker has not yet ran.
        <Button onClick={run}>Run now</Button>
      </Message>
    );
  } if (lastFetchedStatus === duplicateCheckerStatuses.fetch_in_progress) {
    return (
      <Message info>
        Duplicate Checker is currently running. Please check after sometime.
      </Message>
    );
  } if (lastFetchedStatus === duplicateCheckerStatuses.fetch_successful) {
    return (
      <Message positive>
        {`Duplicate Checker ran successfully at ${
          DateTime.fromISO(lastFetchedTime).toLocal().toRelative()}.`}
        <Button onClick={run}>Re-run now</Button>
      </Message>
    );
  } if (lastFetchedStatus === duplicateCheckerStatuses.fetch_failed) {
    return (
      <Message negative>
        Something went wrong. Please try running again.
        <Button onClick={run}>Re-run now</Button>
      </Message>
    );
  }
}
