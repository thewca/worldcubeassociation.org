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
    status: ticketsCompetitionResultStatuses.merged_inbox_results,
    description: `WRT will have a rough look at the results to make sure that
    there is no major flaw that requires aborting the posting process. For
    example, check if there are big suspicious chunks of DNFs/DNSs and verify
    that the shape of the results is sound (e.g. results should generally grow
    “wider” from top to bottom with very few exceptions like DNFs or cutoffs).
    Once done with the rough look, proceed to click the “Merge Inbox Results”
    button which will copy data from InboxResults to Results, then clear the
    data in InboxResults.`,
  },
  {
    status: ticketsCompetitionResultStatuses.created_wca_ids,
    description: `WRT will have to go through the newcomers, verify their
    details and generate WCA ID for them.`,
  },
  {
    status: ticketsCompetitionResultStatuses.posted,
    description: `When the results are posted, the results become public, and
    also email notification will be sent to participants informing that the
    results are posted.`,
  },
];

const STATUS_LABELS = {
  submitted: 'Submitted',
  locked_for_posting: 'Locked for Posting',
  warnings_verified: 'Warnings Verified',
  merged_inbox_results: 'Merged Inbox Results',
  created_wca_ids: 'Created WCA IDs',
  posted: 'Posted',
};

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
              {STATUS_LABELS[timelineStatus] || _.startCase(timelineStatus)}
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
