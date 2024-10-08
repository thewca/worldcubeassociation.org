import React from 'react';
import { Icon, Message } from 'semantic-ui-react';
import i18n from '../../../lib/i18n';

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
function canIBookPlaneTickets(registrationStatus, paymentStatus, competitionInfo) {
  switch (registrationStatus) {
    case 'pending':
      if (competitionInfo['using_payment_integrations?'] && paymentStatus !== 'succeeded') {
        return i18n.t('competitions.registration_v2.info.payment_missing');
      }
      return i18n.t('competitions.registration_v2.info.needs_approval');
    case 'accepted':
      return i18n.t('competitions.registration_v2.info.is_accepted');
    case 'cancelled':
      return i18n.t('competitions.registration_v2.info.is_cancelled');
    case 'rejected':
      return i18n.t('competitions.registration_v2.info.is_rejected');
    case 'waiting_list':
      return i18n.t('competitions.registration_v2.info.is_waitlisted');
    default:
      return `[Testers: This should not happen. If you reached this message, please contact WST! Debug: '${registrationStatus}']`;
  }
}

function RegistrationStatusMessage({ registration, competitionInfo }) {
  return (
    <Message
      info={registration.competing.registration_status === 'pending'}
      success={registration.competing.registration_status === 'accepted'}
      negative={registration.competing.registration_status === 'cancelled'
        || registration.competing.registration_status === 'rejected'}
      warning={registration.competing.registration_status === 'waiting_list'}
      icon
    >
      <Icon name={registrationIconByStatus(registration.competing.registration_status)} />
      <Message.Content>
        <Message.Header>
          {i18n.t(
            `competitions.registration_v2.register.registration_status.${registration.competing.registration_status}`,
            {
              waiting_list_position: registration.competing.waiting_list_position,
            },
          )}
        </Message.Header>
        <p>
          {canIBookPlaneTickets(
            registration.competing.registration_status,
            registration.payment?.payment_status,
            competitionInfo,
          )}
        </p>
      </Message.Content>
    </Message>
  );
}

export default function RegistrationStatus({ registration, competitionInfo }) {
  return (
    <RegistrationStatusMessage
      registration={registration}
      competitionInfo={competitionInfo}
    />
  );
}
