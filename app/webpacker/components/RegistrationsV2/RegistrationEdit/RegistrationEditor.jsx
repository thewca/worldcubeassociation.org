import React, { useCallback } from 'react';
import {
  Button,
  Form,
  Header,
  Icon,
  Message,
  Segment,
} from 'semantic-ui-react';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import { showMessage } from '../Register/RegistrationMessage';
import EventSelector from '../../wca/EventSelector';
import Payments from './Payments';
import { personUrl, editPersonUrl } from '../../../lib/requests/routes.js.erb';
import { useConfirm } from '../../../lib/providers/ConfirmProvider';
import I18n from '../../../lib/i18n';
import RegistrationHistory from './RegistrationHistory';
import { hasPassed } from '../../../lib/utils/dates';
import { useRegistration } from '../lib/RegistrationProvider';
import {
  useFormObjectState,
  useFormSuccessHandler,
  useHasFormValueChanged,
} from '../../wca/FormBuilder/provider/FormObjectProvider';
import { useInputUpdater } from '../../../lib/hooks/useInputState';
import { useOrderedSetWrapper } from '../../../lib/hooks/useOrderedSet';
import { WCA_EVENT_IDS } from '../../../lib/wca-data.js.erb';
import { useUpdateRegistrationMutation } from '../lib/mutations';

export default function RegistrationEditor({ registrationId, competitor, competitionInfo }) {
  const dispatch = useDispatch();

  const [comment, setCommentRaw] = useFormObjectState('comment', ['competing']);
  const setComment = useInputUpdater(setCommentRaw);

  const [adminComment, setAdminCommentRaw] = useFormObjectState('admin_comment', ['competing']);
  const setAdminComment = useInputUpdater(setAdminCommentRaw);

  const [guests, setGuestsRaw] = useFormObjectState('guests');
  const setGuests = useInputUpdater(setGuestsRaw, true);

  const [nativeEventIds, setNativeEventIds] = useFormObjectState('event_ids', ['competing']);
  const selectedEventIds = useOrderedSetWrapper(nativeEventIds, setNativeEventIds, WCA_EVENT_IDS);

  const [status, setStatusRaw] = useFormObjectState('registration_status', ['competing']);
  const setStatus = useInputUpdater(setStatusRaw);

  const confirm = useConfirm();

  const formSuccess = useFormSuccessHandler();

  const { registration, refetchRegistration } = useRegistration();

  const {
    mutate: updateRegistrationMutation,
    isPending: isUpdating,
  } = useUpdateRegistrationMutation(competitionInfo, competitor);

  const hasEventsChanged = useHasFormValueChanged('event_ids', ['competing']);
  const hasCommentChanged = useHasFormValueChanged('comment', ['competing']);
  const hasAdminCommentChanged = useHasFormValueChanged('admin_comment', ['competing']);
  const hasStatusChanged = useHasFormValueChanged('registration_status', ['competing']);
  const hasGuestsChanged = useHasFormValueChanged('guests');

  const hasChanges = hasEventsChanged
    || hasCommentChanged
    || hasAdminCommentChanged
    || hasStatusChanged
    || hasGuestsChanged;

  const commentIsValid = comment || !competitionInfo.force_comment_in_registration;
  const maxEvents = competitionInfo.events_per_registration_limit ?? Infinity;
  const eventsAreValid = selectedEventIds.size > 0 && selectedEventIds.size <= maxEvents;

  const handleRegisterClick = useCallback(() => {
    if (!hasChanges) {
      dispatch(showMessage('competitions.registration_v2.update.no_changes', 'basic'));
    } else if (!commentIsValid) {
      // i18n-tasks-use t('registrations.errors.cannot_register_without_comment')
      dispatch(showMessage('registrations.errors.cannot_register_without_comment', 'negative'));
    } else if (!eventsAreValid) {
      // i18n-tasks-use t('registrations.errors.must_register')
      dispatch(showMessage(
        maxEvents === Infinity
          ? 'registrations.errors.must_register'
          : 'registrations.errors.exceeds_event_limit.other',
        'negative',
      ));
    } else {
      // Only send changed values
      const body = {
        user_id: competitor.id,
        competition_id: competitionInfo.id,
        competing: {},
      };
      if (hasEventsChanged) {
        body.competing.event_ids = selectedEventIds.asArray;
      }
      if (hasCommentChanged) {
        body.competing.comment = comment;
      }
      if (hasAdminCommentChanged) {
        body.competing.admin_comment = adminComment;
      }
      if (hasStatusChanged) {
        body.competing.status = status;
      }
      if (hasGuestsChanged) {
        body.guests = guests;
      }
      confirm({
        content: I18n.t('competitions.registration_v2.update.organizer_update_confirm'),
      }).then(() => {
        updateRegistrationMutation(body, {
          onSuccess: (data) => formSuccess(data.registration),
        });
      }).catch(() => {});
    }
  }, [
    hasChanges,
    confirm,
    commentIsValid,
    eventsAreValid,
    dispatch,
    maxEvents,
    competitor.id,
    competitionInfo.id,
    hasEventsChanged,
    hasCommentChanged,
    hasAdminCommentChanged,
    hasStatusChanged,
    hasGuestsChanged,
    updateRegistrationMutation,
    selectedEventIds.asArray,
    comment,
    adminComment,
    status,
    guests,
    formSuccess,
  ]);

  const registrationEditDeadlinePassed = Boolean(competitionInfo.event_change_deadline_date)
    && hasPassed(competitionInfo.event_change_deadline_date);

  return (
    <Segment padded attached loading={isUpdating}>
      <Form onSubmit={handleRegisterClick}>
        {registrationEditDeadlinePassed && (
          <Message>
            {I18n.t('registrations.errors.edit_deadline_passed')}
          </Message>
        )}
        <Header>
          {competitor.name}
          {' ('}
          {competitor.wca_id ? (
            <a href={personUrl(competitor.wca_id)} target="_blank" rel="noreferrer" className="hide-new-window-icon">{competitor.wca_id}</a>
          ) : (
            I18n.t('registrations.registration_info_people.newcomer.one')
          )}
          {') '}
          <a href={editPersonUrl(competitor.id)} target="_blank" rel="noreferrer" className="hide-new-window-icon"><Icon name="edit" /></a>
        </Header>
        <Form.Field required error={selectedEventIds.size === 0}>
          <EventSelector
            id="event-selection"
            eventList={competitionInfo.event_ids}
            selectedEvents={selectedEventIds.asArray}
            onEventClick={selectedEventIds.toggle}
            onAllClick={() => selectedEventIds.update(competitionInfo.event_ids)}
            onClearClick={selectedEventIds.clear}
            maxEvents={maxEvents}
            shouldErrorOnEmpty
          />
        </Form.Field>

        <Form.TextArea
          label={I18n.t('activerecord.attributes.registration.comments')}
          id="competitor-comment"
          maxLength={240}
          value={comment}
          onChange={setComment}
        />

        <Form.TextArea
          label={I18n.t('activerecord.attributes.registration.administrative_notes')}
          id="admin-comment"
          maxLength={240}
          value={adminComment}
          onChange={setAdminComment}
        />

        <Header as="h6">{I18n.t('activerecord.attributes.registration.status')}</Header>
        <Form.Group inline>
          <Form.Radio
            id="radio-status-pending"
            label={I18n.t('competitions.registration_v2.update.pending')}
            name="regStatusRadioGroup"
            value="pending"
            checked={status === 'pending'}
            onChange={setStatus}
          />
          <Form.Radio
            id="radio-status-accepted"
            label={I18n.t('competitions.registration_v2.update.approved')}
            name="regStatusRadioGroup"
            value="accepted"
            checked={status === 'accepted'}
            onChange={setStatus}
          />
          <Form.Radio
            id="radio-status-waiting-list"
            label={I18n.t('competitions.registration_v2.update.waitlist')}
            name="regStatusRadioGroup"
            value="waiting_list"
            checked={status === 'waiting_list'}
            onChange={setStatus}
          />
          <Form.Radio
            id="radio-status-cancelled"
            label={I18n.t('competitions.registration_v2.update.cancelled')}
            name="regStatusRadioGroup"
            value="cancelled"
            checked={status === 'cancelled'}
            onChange={setStatus}
          />
          <Form.Radio
            id="radio-status-rejected"
            label={I18n.t('competitions.registration_v2.update.rejected')}
            name="regStatusRadioGroup"
            value="rejected"
            disabled={registrationEditDeadlinePassed}
            checked={status === 'rejected'}
            onChange={setStatus}
          />
        </Form.Group>
        <Form.Input
          label={I18n.t('activerecord.attributes.registration.guests')}
          id="guest-dropdown"
          type="number"
          min={0}
          max={99}
          value={guests}
          onChange={setGuests}
        />
        <Button
          color="blue"
          disabled={isUpdating || !hasChanges}
        >
          {I18n.t('registrations.update')}
        </Button>
      </Form>

      {/* TODO: Add information about Series Registration here */}
      {/* i18n-tasks-use t('registrations.list.series_registrations') */}

      {competitionInfo['using_payment_integrations?'] && (
        <>
          <Header>Payments</Header>
          {(registration.payment.payment_statuses.includes('succeeded') || registration.payment.payment_statuses.includes('refund')) && (
            <Payments
              competitionId={competitionInfo.id}
              registrationId={registrationId}
              onSuccess={refetchRegistration}
            />
          )}
        </>
      )}
      <RegistrationHistory history={registration.history.toReversed()} />
    </Segment>
  );
}
