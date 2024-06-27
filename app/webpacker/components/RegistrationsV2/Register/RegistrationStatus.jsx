import React from 'react';
import { Checkbox, Icon, Message } from 'semantic-ui-react';
import i18n from '../../../lib/i18n';
import useCheckboxState from '../../../lib/hooks/useCheckboxState';

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
function canIBookPlaneTickets(registrationStatus) {
  switch (registrationStatus) {
    case 'pending':
      return "Don't book your flights and hotel just yet - the organizers still have to manually approve your registration. This can take time.";
    case 'accepted':
      return 'Pack your bags and book your flights - you have a spot at the competition!';
    case 'cancelled':
      return 'Your registration has been deleted and you will not be competing.';
    case 'waiting_list':
      return "Don't book a flight, but don't give up hope either. The competition is full, but you have been placed on a waiting list, and you will receive an email if enough spots open up for you to be able to attend.";
    default:
      return `[Testers: This should not happen. If you reached this message, please contact WST! Debug: '${registrationStatus}']`;
  }
}

function RegistrationStatusMessage({ registration, showAlternativeDescription }) {
  return (
    <Message
      info={registration.competing.registration_status === 'pending'}
      success={registration.competing.registration_status === 'accepted'}
      negative={registration.competing.registration_status === 'cancelled'}
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
        {showAlternativeDescription && (
          <p>
            {canIBookPlaneTickets(registration.competing.registration_status)}
          </p>
        )}
      </Message.Content>
    </Message>
  );
}

export default function RegistrationStatus({ registration }) {
  const [showAlternativeToggle, setAlternativeToggle] = useCheckboxState(true);

  return (
    <>
      <Checkbox toggle value={showAlternativeToggle} onChange={setAlternativeToggle} label="Show alternative status description" />

      <RegistrationStatusMessage
        registration={registration}
        showAlternativeDescription={showAlternativeToggle}
      />
    </>
  );
}
