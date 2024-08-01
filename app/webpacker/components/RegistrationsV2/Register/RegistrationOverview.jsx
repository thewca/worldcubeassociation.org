import React from 'react';
import {
  Button, ButtonGroup, Form, FormField, Header, Message, Segment,
} from 'semantic-ui-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import i18n from '../../../lib/i18n';
import EventIcon from '../../wca/EventIcon';
import { hasPassed } from '../../../lib/utils/dates';
import { events } from '../../../lib/wca-data.js.erb';
import updateRegistration from '../api/registration/patch/update_registration';
import { setMessage } from './RegistrationMessage';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import { useConfirm } from '../../../lib/providers/ConfirmProvider';
import { contactCompetitionUrl } from '../../../lib/requests/routes.js.erb';

export default function RegistrationOverview({
  nextStep, registration, competitionInfo,
}) {
  const dispatch = useDispatch();
  const confirm = useConfirm();

  const hasRegistrationEditDeadlinePassed = hasPassed(
    competitionInfo.event_change_deadline_date ?? competitionInfo.start_date,
  );

  const deleteAllowed = (registration.competing.registration_status !== 'accepted'
      || competitionInfo.allow_registration_self_delete_after_acceptance);

  const queryClient = useQueryClient();

  const { mutate: deleteRegistrationMutation, isPending: isDeleting } = useMutation({
    mutationFn: () => updateRegistration({
      user_id: registration.user_id,
      competition_id: competitionInfo.id,
      competing: {
        status: 'cancelled',
      },
    }),
    onError: (data) => {
      const { error } = data.json;
      dispatch(setMessage(
        error
          ? `competitions.registration_v2.errors.${error}`
          : 'registrations.flash.failed',
        'negative',
      ));
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        ['registration', competitionInfo.id, registration.user_id],
        {
          ...data.registration,
          payment: registration.payment,
        },
      );
      dispatch(setMessage('competitions.registration_v2.register.registration_status.cancelled', 'positive'));
      nextStep({ toStart: true });
    },
  });

  const deleteRegistration = (event) => {
    event.preventDefault();
    confirm({ content: i18n.t(deleteAllowed ? 'registrations.delete_confirm' : 'competitions.registration_v2.update.delete_confirm_contact') })
      .then(() => (deleteAllowed
        ? deleteRegistrationMutation()
        : window.location = contactCompetitionUrl(competitionInfo.id, encodeURIComponent(i18n.t('competitions.registration_v2.update.delete_contact_message')))))
      .catch(() => nextStep({ refresh: true }));
  };

  return (
    <>
      { !competitionInfo['using_payment_integrations?'] && registration.competing.registration_status === 'pending' && competitionInfo.base_entry_fee_lowest_denomination && (
        <Message info>
          {i18n.t('registrations.wont_pay_here')}
        </Message>
      )}
      <Segment loading={isDeleting}>
        <Header>{i18n.t('competitions.nav.menu.registration')}</Header>
        <Form onSubmit={nextStep} size="large">
          <FormField>
            <label>
              {i18n.t('activerecord.attributes.registration.registration_competition_events')}
              :
            </label>
            { /* Make sure to keep WCA Event order */}
            {events.official
              .filter((e) => registration.competing.event_ids.includes(e.id))
              .map((e) => (<EventIcon key={e.id} id={e.id} style={{ cursor: 'unset' }} />))}
          </FormField>
          <FormField />
          <FormField>
            <label>
              {i18n.t('activerecord.attributes.registration.comments')}
              :
            </label>
            {registration.competing.comment.length > 0 ? registration.competing.comment : i18n.t('competitions.schedule.rooms_panel.none')}
          </FormField>
          <FormField />
          <FormField>
            <label>
              {i18n.t('activerecord.attributes.registration.guests')}
              :
            </label>
            {registration.guests}
          </FormField>
          <ButtonGroup widths={2}>
            <Button
              primary
              type="submit"
              disabled={hasRegistrationEditDeadlinePassed}
            >
              {i18n.t('registrations.update')}
            </Button>
            <Button
              negative
              onClick={deleteRegistration}
            >
              {i18n.t('registrations.delete_registration')}
            </Button>
          </ButtonGroup>
        </Form>
      </Segment>
    </>
  );
}
