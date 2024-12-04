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
  Header, List,
  Message,
  Segment,
} from 'semantic-ui-react';
import { getSingleRegistration } from '../api/registration/get/get_registrations';
import updateRegistration from '../api/registration/patch/update_registration';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import { setMessage } from '../Register/RegistrationMessage';
import Loading from '../../Requests/Loading';
import { EventSelector } from '../../CompetitionsOverview/CompetitionsFilters';
import Refunds from './Refunds';
import { editPersonUrl } from '../../../lib/requests/routes.js.erb';
import { useConfirm } from '../../../lib/providers/ConfirmProvider';
import I18n from '../../../lib/i18n';
import RegistrationHistory from './RegistrationHistory';
import { hasPassed } from '../../../lib/utils/dates';
import getUsersInfo from '../api/user/post/getUserInfo';

export default function RegistrationEditor({ competitor, competitionInfo }) {
  const dispatch = useDispatch();
  const [comment, setComment] = useState('');
  const [adminComment, setAdminComment] = useState('');
  const [status, setStatus] = useState('');
  const [guests, setGuests] = useState(0);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [registration, setRegistration] = useState({});
  const confirm = useConfirm();

  const queryClient = useQueryClient();

  const { isLoading: isRegistrationLoading, data: serverRegistration, refetch } = useQuery({
    queryKey: ['registration-admin', competitionInfo.id, competitor.id],
    queryFn: () => getSingleRegistration(competitor.id, competitionInfo),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    refetchOnMount: 'always',
  });

  const { isLoading, data: competitorsInfo } = useQuery({
    queryKey: ['history-user', serverRegistration?.history],
    queryFn: () => getUsersInfo(_.uniq(serverRegistration.history.flatMap((e) => (e.actor_type === 'user' ? Number(e.actor_id) : [])))),
    enabled: Boolean(serverRegistration),
  });

  const { mutate: updateRegistrationMutation, isPending: isUpdating } = useMutation({
    mutationFn: updateRegistration,
    onError: (data) => {
      const { error } = data.json;
      dispatch(setMessage(
        `competitions.registration_v2.errors.${error}`,
        'negative',
      ));
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        ['registration-admin', competitionInfo.id, competitor.id],
        {
          ...data.registration,
          payment: serverRegistration.payment,
        },
      );
      // Going from cancelled -> pending
      if (registration.competing.registration_status === 'cancelled') {
        dispatch(setMessage('registrations.flash.registered', 'positive'));
        // Not changing status
      } else {
        dispatch(setMessage('registrations.flash.updated', 'positive'));
      }
    },
  });

  useEffect(() => {
    if (serverRegistration) {
      setRegistration(serverRegistration);
      setComment(serverRegistration.competing.comment ?? '');
      setStatus(serverRegistration.competing.registration_status);
      setSelectedEvents(serverRegistration.competing.event_ids);
      setAdminComment(serverRegistration.competing.admin_comment ?? '');
      setGuests(serverRegistration.guests ?? 0);
    }
  }, [serverRegistration]);

  const hasEventsChanged = serverRegistration
    && _.xor(serverRegistration.competing.event_ids, selectedEvents).length > 0;
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
  const eventsAreValid = selectedEvents.length > 0 && selectedEvents.length <= maxEvents;

  const handleRegisterClick = useCallback(() => {
    if (!hasChanges) {
      dispatch(setMessage('competitions.registration_v2.update.no_changes', 'basic'));
    } else if (!commentIsValid) {
      // i18n-tasks-use t('registrations.errors.cannot_register_without_comment')
      dispatch(setMessage('registrations.errors.cannot_register_without_comment', 'negative'));
    } else if (!eventsAreValid) {
      // i18n-tasks-use t('registrations.errors.must_register')
      // i18n-tasks-use t('registrations.errors.exceeds_event_limit.other')
      dispatch(setMessage(
        maxEvents === Infinity
          ? 'registrations.errors.must_register'
          : 'registrations.errors.exceeds_event_limit.other',
        'negative',
      ));
    } else {
      dispatch(setMessage('competitions.registration_v2.update.being_updated', 'positive'));
      // Only send changed values
      const body = {
        user_id: competitor.id,
        competition_id: competitionInfo.id,
        competing: {},
      };
      if (hasEventsChanged) {
        body.competing.event_ids = selectedEvents;
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
        content: I18n.t('competitions.registration_v2.update.update_confirm'),
      }).then(() => {
        updateRegistrationMutation(body);
      }).catch(() => {});
    }
  }, [hasChanges,
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
    selectedEvents,
    comment,
    adminComment,
    status,
    guests]);

  const handleEventSelection = ({ type, eventId }) => {
    if (type === 'select_all_events') {
      setSelectedEvents(competitionInfo.event_ids);
    } else if (type === 'clear_events') {
      setSelectedEvents([]);
    } else if (type === 'toggle_event') {
      const index = selectedEvents.indexOf(eventId);
      if (index === -1) {
        setSelectedEvents([...selectedEvents, eventId]);
      } else {
        setSelectedEvents(selectedEvents.toSpliced(index, 1));
      }
    }
  };

  const registrationEditDeadlinePassed = Boolean(competitionInfo.event_change_deadline_date)
    && hasPassed(competitionInfo.event_change_deadline_date);

  if (isLoading || isRegistrationLoading) {
    return <Loading />;
  }

  return (
    <Segment padded attached loading={isUpdating}>
      <Form onSubmit={handleRegisterClick}>
        {!competitor.wca_id && (
          <Message>
            This person registered with an account. You can edit their
            personal information
            {' '}
            <a href={editPersonUrl(competitor.id)}>here</a>
            .
          </Message>
        )}
        {registrationEditDeadlinePassed && (
          <Message>
            The Registration Edit Deadline has passed!
            <strong>Changes should only be made in extraordinary circumstances</strong>
          </Message>
        )}
        <Header>{competitor.name}</Header>
        <Form.Field required error={selectedEvents.length === 0}>
          <EventSelector
            onEventSelection={handleEventSelection}
            eventList={competitionInfo.event_ids}
            selectedEvents={selectedEvents}
            id="event-selection"
            maxEvents={maxEvents}
            shouldErrorOnEmpty
          />
        </Form.Field>

        <label>Comment</label>
        <Form.TextArea
          id="competitor-comment"
          maxLength={240}
          value={comment}
          onChange={(event, data) => setComment(data.value)}
        />

        <label>Administrative Notes</label>
        <Form.TextArea
          id="admin-comment"
          maxLength={240}
          value={adminComment}
          onChange={(event, data) => setAdminComment(data.value)}
        />

        <Form.Group inline>
          <label>Status</label>
          <Form.Radio
            id="radio-status-pending"
            label="Pending"
            name="regStatusRadioGroup"
            value="pending"
            checked={status === 'pending'}
            onChange={(event, data) => setStatus(data.value)}
          />
          <Form.Radio
            id="radio-status-accepted"
            label="Accepted"
            name="regStatusRadioGroup"
            value="accepted"
            checked={status === 'accepted'}
            onChange={(event, data) => setStatus(data.value)}
          />
          <Form.Radio
            id="radio-status-waiting-list"
            label="Waiting List"
            name="regStatusRadioGroup"
            value="waiting_list"
            checked={status === 'waiting_list'}
            onChange={(event, data) => setStatus(data.value)}
          />
          <Form.Radio
            id="radio-status-cancelled"
            label="Cancelled"
            name="regStatusRadioGroup"
            value="cancelled"
            checked={status === 'cancelled'}
            onChange={(event, data) => setStatus(data.value)}
          />
          <Form.Radio
            id="radio-status-rejected"
            label="Rejected"
            name="regStatusRadioGroup"
            value="rejected"
            disabled={registrationEditDeadlinePassed}
            checked={status === 'rejected'}
            onChange={(event, data) => setStatus(data.value)}
          />
        </Form.Group>
        <label>Guests</label>
        <Form.Input
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
          Update Registration
        </Button>
      </Form>
      {competitionInfo['using_payment_integrations?'] && (
        <>
          <List>
            <List.Header>Payment statuses:</List.Header>
            {registration.payment.payment_statuses.map((paymentStatus) => (
              <List.Item key={paymentStatus}>
                {paymentStatus}
              </List.Item>
            ))}
          </List>
          {(registration.payment.payment_statuses.includes('succeeded') || registration.payment.payment_statuses.includes('refund')) && (
            <Refunds
              competitionId={competitionInfo.id}
              userId={competitor.id}
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
