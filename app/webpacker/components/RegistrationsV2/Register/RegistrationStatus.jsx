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
      return 'No, the organizers still have to manually approve your registration. This can take time.';
    case 'accepted':
      return 'Yes, happy competing!';
    case 'cancelled':
      return 'No, your registration has been deleted and you cannot compete anymore.';
    case 'waiting_list':
      return 'No, you are on a waiting list because the competitor limit has been reached. You will be contacted when a spot opens up, until then you unfortunately cannot compete.';
    default:
      return '[Testers: This should not happen. If you reached this message, please contact WST!]';
  }
}

function HumanFriendlyRegistrationStatus({ registration }) {
  return (
    <Message
      info={registration.competing.registration_status === 'pending'}
      success={registration.competing.registration_status === 'accepted'}
      negative={registration.competing.registration_status === 'cancelled'}
      icon
    >
      <Icon name="plane" />
      <Message.Content>
        <Message.Header>
          Can I pack my bags and book a flight?
        </Message.Header>
        {canIBookPlaneTickets(registration.competing.registration_status)}
      </Message.Content>
    </Message>
  );
}

function SimpleRegistrationStatus({ registration }) {
  return (
    <Message
      info={registration.competing.registration_status === 'pending'}
      success={registration.competing.registration_status === 'accepted'}
      negative={registration.competing.registration_status === 'cancelled'}
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
      </Message.Content>
    </Message>
  );
}

export default function RegistrationStatus({ registration }) {
  const [alternativeToggle, setAlternativeToggle] = useCheckboxState(false);

  return (
    <>
      <Checkbox toggle value={alternativeToggle} onChange={setAlternativeToggle} label="Alternative Registration Status" />
      { alternativeToggle
        ? <HumanFriendlyRegistrationStatus registration={registration} />
        : <SimpleRegistrationStatus registration={registration} /> }
    </>
  );
}
