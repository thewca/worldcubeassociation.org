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

function HumanFriendlyRegistrationStatus({ registration }) {
  const registrationAccepted = registration.competing.registration_status === 'accepted';
  return (
    <Message
      info={!registrationAccepted}
      success={registrationAccepted}
      icon
    >
      <Icon name="plane" />
      <Message.Content>
        <Message.Header>
          Can I pack my bags and book a flight?
        </Message.Header>
        { registrationAccepted ? 'Yes, happy competing' : 'No, the organizers still have to manually approve your registration. This can take time.'}
      </Message.Content>
    </Message>
  );
}

function SimpleRegistrationStatus({ registration }) {
  const registrationAccepted = registration.competing.registration_status === 'accepted';
  return (
    <Message
      info={!registrationAccepted}
      success={registrationAccepted}
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
