import React from 'react';
import {
  Button, ButtonGroup, Form, Header, List, Message, Segment,
} from 'semantic-ui-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import I18n from '../../../lib/i18n';
import EventIcon from '../../wca/EventIcon';
import { hasPassed } from '../../../lib/utils/dates';
import { events } from '../../../lib/wca-data.js.erb';
import updateRegistration from '../api/registration/patch/update_registration';
import { showMessage } from './RegistrationMessage';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import { useConfirm } from '../../../lib/providers/ConfirmProvider';
import { contactCompetitionUrl } from '../../../lib/requests/routes.js.erb';
import RegistrationStatus from './RegistrationStatus';
import { useRegistration } from '../lib/RegistrationProvider';
import { useStepNavigation } from '../lib/StepNavigationProvider';

export default function RegistrationOverview({
  competitionInfo,
}) {
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const { registration, isRejected, isAccepted } = useRegistration();
  const {
    jumpToStart, jumpToStepByKey, refreshStep,
  } = useStepNavigation();

  const hasRegistrationEditDeadlinePassed = hasPassed(
    competitionInfo.event_change_deadline_date ?? competitionInfo.start_date,
  );

  const deleteAllowed = (competitionInfo.competitor_can_cancel === 'always')
    || (competitionInfo.competitor_can_cancel === 'not_accepted' && !isAccepted)
    || (competitionInfo.competitor_can_cancel === 'unpaid' && !registration.payment?.has_paid);

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
      dispatch(showMessage(
        `competitions.registration_v2.errors.${error}`,
        'negative',
      ));
    },
    onSuccess: (data) => {
      jumpToStart();
      queryClient.setQueryData(
        ['registration', competitionInfo.id, registration.user_id],
        {
          ...data.registration,
          payment: registration.payment,
        },
      );
      dispatch(showMessage('competitions.registration_v2.register.registration_status.cancelled', 'positive'));
    },
  });

  const deleteRegistration = (event) => {
    event.preventDefault();
    // i18n-tasks-use t('registrations.delete_confirm')
    confirm({ content: I18n.t(deleteAllowed ? 'registrations.delete_confirm' : 'competitions.registration_v2.update.delete_confirm_contact') })
      // eslint-disable-next-line no-return-assign
      .then(() => (deleteAllowed
        ? deleteRegistrationMutation()
        : window.location = contactCompetitionUrl(competitionInfo.id, encodeURIComponent(I18n.t('competitions.registration_v2.update.delete_contact_message')))))
      .catch(() => refreshStep());
  };

  if (isRejected) {
    return <RegistrationStatus registration={registration} competitionInfo={competitionInfo} />;
  }

  return (
    <>
      <RegistrationStatus registration={registration} competitionInfo={competitionInfo} />
      { !competitionInfo['using_payment_integrations?'] && registration.competing.registration_status === 'pending' && competitionInfo.base_entry_fee_lowest_denomination && (
        <Message info>
          {I18n.t('registrations.wont_pay_here')}
        </Message>
      )}
      <Segment loading={isDeleting}>
        <Header>{I18n.t('competitions.nav.menu.registration')}</Header>
        <Form onSubmit={() => jumpToStepByKey('competing')} size="large">
          <List>
            <List.Item>
              <List.Header>
                {I18n.t('activerecord.attributes.registration.registration_competition_events')}
                :
              </List.Header>
              { /* Make sure to keep WCA Event order */}
              {events.official
                .filter((e) => registration.competing.event_ids.includes(e.id))
                .map((e) => (
                  <React.Fragment key={e.id}>
                    <EventIcon id={e.id} hoverable={false} />
                    {' '}
                  </React.Fragment>
                ))}
            </List.Item>
            <List.Item>
              <List.Header>
                {I18n.t('activerecord.attributes.registration.comments')}
                :
              </List.Header>
              {registration.competing.comment?.length > 0 ? registration.competing.comment : I18n.t('competitions.schedule.rooms_panel.none')}
            </List.Item>
            {competitionInfo.guests_enabled && (
              <List.Item>
                <List.Header>
                  {I18n.t('activerecord.attributes.registration.guests')}
                  :
                </List.Header>
                {registration.guests}
              </List.Item>
            )}
            <ButtonGroup widths={2}>
              <Button
                primary
                type="submit"
                disabled={hasRegistrationEditDeadlinePassed}
              >
                {I18n.t(hasRegistrationEditDeadlinePassed ? 'competitions.registration_v2.errors.-4001' : 'registrations.update')}
              </Button>
              <Button
                negative
                onClick={deleteRegistration}
              >
                {I18n.t('registrations.delete_registration')}
              </Button>
            </ButtonGroup>
          </List>
        </Form>
      </Segment>
    </>
  );
}
