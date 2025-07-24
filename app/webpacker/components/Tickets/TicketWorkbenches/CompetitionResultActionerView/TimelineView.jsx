import React, { useMemo } from 'react';
import { Icon, Popup, Step } from 'semantic-ui-react';
import _ from 'lodash';
import { ticketsCompetitionResultStatuses } from '../../../../lib/wca-data.js.erb';

const TIMELINE_STATUSES = [
  {
    status: ticketsCompetitionResultStatuses.submitted,
    description: `Delegate has to go through the warnings (if any) and address
    the warnings by filling the details in the form.`,
  },
  {
    status: ticketsCompetitionResultStatuses.locked_for_posting,
    description: `WRT has to lock the results for posting. This is to avoid
    issues like two people accidentally work on same results.`,
  },
  {
    status: ticketsCompetitionResultStatuses.warnings_verified,
    description: `WRT will be shown the list of warnings and the message from
    Delegate. WRT needs to review them and mark it as done.`,
  },
  {
    status: ticketsCompetitionResultStatuses.posted,
    description: `When the results are posted, the results become public, and
    also email notification will be sent to participants informing that the
    results are posted.`,
  },
];

export default function TimelineView({ status }) {
  const currentStatusIndex = useMemo(
    () => TIMELINE_STATUSES.findIndex((s) => s.status === status),
    [status],
  );

  return (
    <Step.Group ordered>
      {TIMELINE_STATUSES.map(({ status: timelineStatus, description }, timelineStatusIndex) => (
        <Step
          completed={timelineStatusIndex <= currentStatusIndex}
          active={timelineStatusIndex === currentStatusIndex + 1}
        >
          <Step.Content>
            <Step.Title>
              {_.startCase(timelineStatus)}
              <Popup
                trigger={<Icon name="info circle" size="large" />}
                content={description}
              />
            </Step.Title>
          </Step.Content>
        </Step>
      ))}
    </Step.Group>
  );
}
