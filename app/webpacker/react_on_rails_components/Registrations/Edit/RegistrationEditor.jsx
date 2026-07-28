import React, { useCallback } from 'react';
import {
  Button,
  Form,
  Header,
  Icon,
  Message,
  Segment,
} from 'semantic-ui-react';
import { useQueryClient } from '@tanstack/react-query';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import { showMessage } from '../Register/RegistrationMessage';
import EventSelector from '../../wca/EventSelector';
import RegistrationPayments from './RegistrationPayments';
import { personUrl, editPersonUrl } from '../../../lib/requests/routes.js.erb';
import { useConfirm } from '../../../lib/providers/ConfirmProvider';
import I18n from '../../../lib/i18n';
import RegistrationHistory from './RegistrationHistory';
import { hasPassed } from '../../../lib/utils/dates';
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
  const queryClient = useQueryClient();

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
        competing: {
          comment: hasCommentChanged ? comment : undefined,
          event_ids: hasEventsChanged ? selectedEventIds.asArray : undefined,
          admin_comment: hasAdminCommentChanged ? adminComment : undefined,
          status: hasStatusChanged ? status : undefined,
        },
        guests: hasGuestsChanged ? guests : undefined,
      };

      confirm({
        content: I18n.t('competitions.registration_v2.update.organizer_update_confirm'),
      }).then(() => {
        updateRegistrationMutation({ registrationId, payload: body }, {
          onSuccess: (data) => {
            dispatch(showMessage('registrations.flash.updated', 'positive'));
            formSuccess(data.registration);

            queryClient.refetchQueries({ queryKey: ['registration-history', registrationId], exact: true });
            queryClient.refetchQueries({ queryKey: ['registration-payments', registrationId], exact: true });
          },
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
    registrationId,
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
    queryClient,
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
            I18n.t('registrations.registration_info_people.newcomer', { count: 1 })
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
        <RegistrationPayments
          competitionId={competitionInfo.id}
          registrationId={registrationId}
        />
      )}
      <RegistrationHistory registrationId={registrationId} />
    </Segment>
  );
}
