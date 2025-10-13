import React from 'react';
import { Icon, Message } from 'semantic-ui-react';
import I18n from '../../../lib/i18n';

function registrationIconByStatus(registrationStatus) {
  switch (registrationStatus) {
    case 'pending':
      return 'hourglass';
    case 'accepted':
      return 'checkmark';
    case 'cancelled':
      return 'delete';
    case 'waiting_list':
      return 'wait';
    default:
      return 'info circle';
  }
}

// We are not YET adding this to the locale i18n because this new feature is a test run.
// If we add these strings to en.yml immediately, translators will get a notification asking them
//   to translate these strings during our test mode deployment. But we aren't even sure whether
//   we want to keep these strings. So we hard-code them "for now" (when did that ever go wrong?)
function canIBookPlaneTickets(registrationStatus, hasPaid, competitionInfo) {
  switch (registrationStatus) {
    case 'pending':
      if (competitionInfo['using_payment_integrations?'] && !hasPaid) {
        return I18n.t('competitions.registration_v2.info.payment_missing');
      }
      return I18n.t('competitions.registration_v2.info.needs_approval');
    case 'accepted':
      return I18n.t('competitions.registration_v2.info.is_accepted');
    case 'cancelled':
      return I18n.t('competitions.registration_v2.info.is_cancelled');
    case 'rejected':
      return I18n.t('competitions.registration_v2.info.is_rejected');
    case 'waiting_list':
      return I18n.t('competitions.registration_v2.info.is_waitlisted');
    default:
      return `[Testers: This should not happen. If you reached this message, please contact WST! Debug: '${registrationStatus}']`;
  }
}

export default function RegistrationStatus({ registration, hasPaid = false, competitionInfo }) {
  const {
    registration_status: registrationStatus,
    waiting_list_position: waitingListPosition,
  } = registration.competing;

  return (
    <Message
      info={registrationStatus === 'pending'}
      success={registrationStatus === 'accepted'}
      negative={registrationStatus === 'cancelled'
        || registrationStatus === 'rejected'}
      warning={registrationStatus === 'waiting_list'}
      icon
    >
      <Icon name={registrationIconByStatus(registrationStatus)} />
      <Message.Content>
        <Message.Header>
          {I18n.t(
            `competitions.registration_v2.register.registration_status.${registrationStatus}`,
            {
              waiting_list_position: waitingListPosition,
            },
          )}
        </Message.Header>
        <p>
          {canIBookPlaneTickets(
            registrationStatus,
            hasPaid,
            competitionInfo,
          )}
        </p>
      </Message.Content>
    </Message>
  );
}
