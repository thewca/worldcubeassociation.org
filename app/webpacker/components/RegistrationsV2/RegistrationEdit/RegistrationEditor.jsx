import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import _ from 'lodash';
import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  Button,
  Form,
  Header,
  Icon,
  List,
  Message,
  Segment,
} from 'semantic-ui-react';
import updateRegistration from '../api/registration/patch/update_registration';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import { showMessage } from '../Register/RegistrationMessage';
import Loading from '../../Requests/Loading';
import EventSelector from '../../wca/EventSelector';
import Payments from './Payments';
import { personUrl, editPersonUrl } from '../../../lib/requests/routes.js.erb';
import { useConfirm } from '../../../lib/providers/ConfirmProvider';
import I18n from '../../../lib/i18n';
import RegistrationHistory from './RegistrationHistory';
import { hasPassed } from '../../../lib/utils/dates';
import getUsersInfo from '../api/user/post/getUserInfo';
import { useRegistration } from '../lib/RegistrationProvider';
import useSet from '../../../lib/hooks/useSet';

export default function RegistrationEditor({ competitor, competitionInfo }) {
  const dispatch = useDispatch();
  const [comment, setComment] = useState('');
  const [adminComment, setAdminComment] = useState('');
  const [status, setStatus] = useState('');
  const [guests, setGuests] = useState(0);
  const selectedEventIds = useSet();
  const [registration, setRegistration] = useState({});
  const confirm = useConfirm();

  const queryClient = useQueryClient();

  const {
    isFetching: isRegistrationLoading,
    registration: serverRegistration, refetchRegistration: refetch,
  } = useRegistration();

  const { isLoading, data: competitorsInfo } = useQuery({
    queryKey: ['history-user', serverRegistration?.history],
    queryFn: () => getUsersInfo(_.uniq(serverRegistration.history.flatMap((e) => (
      (e.actor_type === 'user' || e.actor_type === 'worker') ? Number(e.actor_id) : [])))),
    enabled: Boolean(serverRegistration),
  });

  const { mutate: updateRegistrationMutation, isPending: isUpdating } = useMutation({
    mutationFn: updateRegistration,
    onError: (data) => {
      const { error } = data.json;
      dispatch(showMessage(
        `competitions.registration_v2.errors.${error}`,
        'negative',
      ));
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        ['registration', competitionInfo.id, competitor.id],
        {
          ...data.registration,
          payment: serverRegistration.payment,
        },
      );
      // Going from cancelled -> pending
      if (registration.competing.registration_status === 'cancelled') {
        dispatch(showMessage('registrations.flash.registered', 'positive'));
        // Not changing status
      } else {
        dispatch(showMessage('registrations.flash.updated', 'positive'));
      }
    },
  });

  // using selectedEventIds.update in dependency array causes warnings
  const { update: setSelectedEventIds } = selectedEventIds;
  useEffect(() => {
    if (serverRegistration) {
      setRegistration(serverRegistration);
      setComment(serverRegistration.competing.comment ?? '');
      setStatus(serverRegistration.competing.registration_status);
      setSelectedEventIds(serverRegistration.competing.event_ids);
      setAdminComment(serverRegistration.competing.admin_comment ?? '');
      setGuests(serverRegistration.guests ?? 0);
    }
  }, [serverRegistration, setSelectedEventIds]);

  const hasEventsChanged = serverRegistration
    && _.xor(serverRegistration.competing.event_ids, selectedEventIds.asArray).length > 0;
  const hasCommentChanged = serverRegistration
    && comment !== (serverRegistration.competing.comment ?? '');
  const hasAdminCommentChanged = serverRegistration
    && adminComment !== (serverRegistration.competing.admin_comment ?? '');
  const hasStatusChanged = serverRegistration
    && status !== serverRegistration.competing.registration_status;
  const hasGuestsChanged = serverRegistration && guests !== serverRegistration.guests;

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
        updateRegistrationMutation(body);
        dispatch(showMessage('competitions.registration_v2.update.being_updated', 'positive'));
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
  ]);

  const registrationEditDeadlinePassed = Boolean(competitionInfo.event_change_deadline_date)
    && hasPassed(competitionInfo.event_change_deadline_date);

  if (isLoading || isRegistrationLoading) {
    return <Loading />;
  }

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
          onChange={(event, data) => setComment(data.value)}
        />

        <Form.TextArea
          label={I18n.t('activerecord.attributes.registration.administrative_notes')}
          id="admin-comment"
          maxLength={240}
          value={adminComment}
          onChange={(event, data) => setAdminComment(data.value)}
        />

        <Header as="h6">{I18n.t('activerecord.attributes.registration.status')}</Header>
        <Form.Group inline>
          <Form.Radio
            id="radio-status-pending"
            label={I18n.t('competitions.registration_v2.update.pending')}
            name="regStatusRadioGroup"
            value="pending"
            checked={status === 'pending'}
            onChange={(event, data) => setStatus(data.value)}
          />
          <Form.Radio
            id="radio-status-accepted"
            label={I18n.t('competitions.registration_v2.update.approved')}
            name="regStatusRadioGroup"
            value="accepted"
            checked={status === 'accepted'}
            onChange={(event, data) => setStatus(data.value)}
          />
          <Form.Radio
            id="radio-status-waiting-list"
            label={I18n.t('competitions.registration_v2.update.waitlist')}
            name="regStatusRadioGroup"
            value="waiting_list"
            checked={status === 'waiting_list'}
            onChange={(event, data) => setStatus(data.value)}
          />
          <Form.Radio
            id="radio-status-cancelled"
            label={I18n.t('competitions.registration_v2.update.cancelled')}
            name="regStatusRadioGroup"
            value="cancelled"
            checked={status === 'cancelled'}
            onChange={(event, data) => setStatus(data.value)}
          />
          <Form.Radio
            id="radio-status-rejected"
            label={I18n.t('competitions.registration_v2.update.rejected')}
            name="regStatusRadioGroup"
            value="rejected"
            disabled={registrationEditDeadlinePassed}
            checked={status === 'rejected'}
            onChange={(event, data) => setStatus(data.value)}
          />
        </Form.Group>
        <Form.Input
          label={I18n.t('activerecord.attributes.registration.guests')}
          id="guest-dropdown"
          type="number"
          min={0}
          max={99}
          value={guests}
          onChange={(event, data) => setGuests(data.value)}
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
          <Message>{I18n.t('payments.labels.payment_statuses')}</Message>
          <List>
            {registration.payment.payment_statuses.map((paymentStatus) => (
              <List.Item key={paymentStatus}>
                {/* i18n-tasks-use t('payments.statuses.succeeded') */}
                {/* i18n-tasks-use t('payments.statuses.refund') */}
                {I18n.t(`payments.statuses.${paymentStatus}`)}
              </List.Item>
            ))}
          </List>
          {(registration.payment.payment_statuses.includes('succeeded') || registration.payment.payment_statuses.includes('refund')) && (
            <Payments
              competitionId={competitionInfo.id}
              registrationId={registration.id}
              onSuccess={refetch}
            />
          )}
        </>
      )}
      <RegistrationHistory
        history={registration.history.toReversed()}
        competitorsInfo={competitorsInfo}
      />
    </Segment>
  );
}
