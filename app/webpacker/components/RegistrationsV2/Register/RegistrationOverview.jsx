import React, { useCallback } from 'react';
import {
  Button, ButtonGroup, Form, Header, List, Message, Segment,
} from 'semantic-ui-react';
import I18n from '../../../lib/i18n';
import EventIcon from '../../wca/EventIcon';
import { hasPassed } from '../../../lib/utils/dates';
import { events } from '../../../lib/wca-data.js.erb';
import { useUpdateRegistrationMutation } from '../lib/mutations';
import { showMessage } from './RegistrationMessage';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import { useConfirm } from '../../../lib/providers/ConfirmProvider';
import { contactCompetitionUrl } from '../../../lib/requests/routes.js.erb';
import RegistrationStatus from './RegistrationStatus';
import { useRegistration } from '../lib/RegistrationProvider';
import { useStepNavigation } from '../lib/StepNavigationProvider';
import { isoMoneyToHumanReadable } from '../../../lib/helpers/money';
import { useFormSuccessHandler } from '../../wca/FormBuilder/provider/FormObjectProvider';

export default function RegistrationOverview({
  competitionInfo,
  user,
}) {
  const dispatch = useDispatch();
  const confirm = useConfirm();

  const onFormSuccess = useFormSuccessHandler();

  const {
    registration,
    registrationId,
    isRejected,
    isAccepted,
    hasPaid,
  } = useRegistration();

  const {
    jumpToStart, jumpToStepByKey,
  } = useStepNavigation();

  const {
    competing: {
      registration_status: registrationStatus,
      comment,
      event_ids: eventIds,
    },
    guests,
    payment: registrationPayment,
  } = registration;

  const hasRegistrationEditDeadlinePassed = hasPassed(
    competitionInfo.event_change_deadline_date ?? competitionInfo.start_date,
  );

  const deleteAllowed = (competitionInfo.competitor_can_cancel === 'always')
    || (competitionInfo.competitor_can_cancel === 'not_accepted' && !isAccepted)
    || (competitionInfo.competitor_can_cancel === 'unpaid' && !hasPaid);

  const {
    mutate: updateRegistrationForDeletionMutation,
    isPending: isDeleting,
  } = useUpdateRegistrationMutation(
    competitionInfo,
    user,
    null, // turn off "update in progress" message
  );

  const deleteRegistrationMutation = useCallback(() => updateRegistrationForDeletionMutation({
    registrationId,
    payload: {
      competing: {
        status: 'cancelled',
      },
    },
  }, {
    onSuccess: (data) => {
      jumpToStart();
      onFormSuccess(data.registration, true);
      dispatch(showMessage('competitions.registration_v2.register.registration_status.cancelled', 'positive'));
    },
  }), [
    updateRegistrationForDeletionMutation,
    registrationId,
    jumpToStart,
    onFormSuccess,
    dispatch,
  ]);

  const deleteRegistration = (event) => {
    event.preventDefault();
    // i18n-tasks-use t('registrations.delete_confirm')
    confirm({ content: I18n.t(deleteAllowed ? 'registrations.delete_confirm' : 'competitions.registration_v2.update.delete_confirm_contact') })
      // eslint-disable-next-line no-return-assign
      .then(() => (deleteAllowed
        ? deleteRegistrationMutation()
        : window.location = contactCompetitionUrl(competitionInfo.id, encodeURIComponent(I18n.t('competitions.registration_v2.update.delete_contact_message')))));
  };

  if (isRejected) {
    return <RegistrationStatus registration={registration} competitionInfo={competitionInfo} />;
  }

  return (
    <>
      <RegistrationStatus registration={registration} competitionInfo={competitionInfo} />
      { !competitionInfo['using_payment_integrations?'] && registrationStatus === 'pending' && competitionInfo.base_entry_fee_lowest_denomination && (
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
                .filter((e) => eventIds.includes(e.id))
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
              {comment?.length > 0 ? comment : I18n.t('competitions.schedule.rooms_panel.none')}
            </List.Item>
            {competitionInfo.guests_enabled && (
              <List.Item>
                <List.Header>
                  {I18n.t('activerecord.attributes.registration.guests')}
                  :
                </List.Header>
                {guests}
              </List.Item>
            )}
            { registrationPayment && (
              <List.Item>
                <List.Header>
                  {I18n.t('payments.labels.net_payment')}
                  :
                </List.Header>
                {isoMoneyToHumanReadable(
                  registrationPayment.paid_amount_iso,
                  registrationPayment.currency_code,
                )}
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
