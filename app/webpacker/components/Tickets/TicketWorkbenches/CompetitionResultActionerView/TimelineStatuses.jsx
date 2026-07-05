import { ticketsCompetitionResultStatuses } from '../../../../lib/wca-data.js.erb';
import WarningsVerification from './WarningsVerification';
import { MergeInboxResults, MergeInboxScrambles } from './MergeInboxResultsData';
import VerifyNewcomers from './VerifyNewcomers';
import CreateWcaIds from './CreateWcaIds';
import FinalSteps from './FinalSteps';
import LockResultsMessage from './LockResultsMessage';

export { default as ResultsPostedMessage } from './ResultsPostedMessage';

export const TIMELINE_ORDER = [
  ticketsCompetitionResultStatuses.submitted,
  ticketsCompetitionResultStatuses.locked_for_posting,
  ticketsCompetitionResultStatuses.warnings_verified,
  ticketsCompetitionResultStatuses.merged_inbox_results,
  ticketsCompetitionResultStatuses.merged_inbox_scrambles,
  ticketsCompetitionResultStatuses.newcomers_verified,
  ticketsCompetitionResultStatuses.created_wca_ids,
  ticketsCompetitionResultStatuses.posted,
];

export const TIMELINE_STATUSES = {
  [ticketsCompetitionResultStatuses.submitted]: {
    label: 'Submitted',
    description: `Delegate has to go through the warnings (if any) and address
    the warnings by filling the details in the form.`,
    Component: null,
  },
  [ticketsCompetitionResultStatuses.locked_for_posting]: {
    label: 'Locked for Posting',
    description: `WRT has to lock the results for posting. This is to avoid
    issues like two people accidentally work on same results.`,
    Component: LockResultsMessage,
  },
  [ticketsCompetitionResultStatuses.warnings_verified]: {
    label: 'Warnings Verified',
    description: `WRT will be shown the list of warnings and the message from
    Delegate. WRT needs to review them and mark it as done.`,
    Component: WarningsVerification,
  },
  [ticketsCompetitionResultStatuses.merged_inbox_results]: {
    label: 'Merged Inbox Results',
    description: `WRT will have a rough look at the results to make sure that
    there is no major flaw that requires aborting the posting process. For
    example, check if there are big suspicious chunks of DNFs/DNSs and verify
    that the shape of the results is sound (e.g. results should generally grow
    “wider” from top to bottom with very few exceptions like DNFs or cutoffs).
    Once done with the rough look, proceed to click the “Merge Inbox Results”
    button which will copy data from InboxResults to Results, then clear the
    data in InboxResults.`,
    Component: MergeInboxResults,
  },
  [ticketsCompetitionResultStatuses.merged_inbox_scrambles]: {
    label: 'Merged Inbox Scrambles',
    description: `WRT will have a rough look at the scrambles to make sure that
    there is no major flaw that requires aborting the posting process. For
    example, check if every scramble looks like it uses notation for that event.
    Once done with the rough look, proceed to click the “Merge Inbox Scrambles”
    button which will copy data from InboxScrambles to Scrambles, then clear the
    data in InboxScrambles.`,
    Component: MergeInboxScrambles,
  },
  [ticketsCompetitionResultStatuses.newcomers_verified]: {
    label: 'Newcomers Verified',
    description: `WRT will have to go through the newcomers, verify their
    details.`,
    Component: VerifyNewcomers,
  },
  [ticketsCompetitionResultStatuses.created_wca_ids]: {
    label: 'Created WCA IDs',
    description: `WRT will have to go through the newcomers, verify their
    details and generate WCA ID for them.`,
    Component: CreateWcaIds,
  },
  [ticketsCompetitionResultStatuses.posted]: {
    label: 'Posted',
    description: `When the results are posted, the results become public, and
    also email notification will be sent to participants informing that the
    results are posted.`,
    Component: FinalSteps,
  },
};
