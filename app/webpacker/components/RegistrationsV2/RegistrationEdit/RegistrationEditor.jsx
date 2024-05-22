import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import _ from 'lodash';
import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  Accordion,
  Button,
  Checkbox, Divider, Form,
  Header,
  Input,
  Message,
  Popup,
  Segment,
  Table,
  TextArea,
} from 'semantic-ui-react';
import { getSingleRegistration } from '../api/registration/get/get_registrations';
import updateRegistration from '../api/registration/patch/update_registration';
import getUsersInfo from '../api/user/post/getUserInfo';
import {
  getShortDateString,
  getShortTimeString,
  hasPassed,
} from '../../../lib/utils/dates';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import { setMessage } from '../Register/RegistrationMessage';
import Loading from '../../Requests/Loading';
import { EventSelector } from '../../CompetitionsOverview/CompetitionsFilters';
import Refunds from './Refunds';
import { editPersonUrl } from '../../../lib/requests/routes.js.erb';

export default function RegistrationEditor({ competitor, competitionInfo }) {
  const dispatch = useDispatch();
  const [comment, setComment] = useState('');
  const [adminComment, setAdminComment] = useState('');
  const [status, setStatus] = useState('');
  const [waitingListPosition, setWaitingListPosition] = useState(0);
  const [guests, setGuests] = useState(0);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [registration, setRegistration] = useState({});

  const queryClient = useQueryClient();

  const { data: serverRegistration, refetch } = useQuery({
    queryKey: ['registration-admin', competitionInfo.id, competitor.id],
    queryFn: () => getSingleRegistration(competitor.id, competitionInfo.id),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    refetchOnMount: 'always',
  });

  const { isLoading, data: competitorsInfo } = useQuery({
    queryKey: ['history-user', serverRegistration?.history],
    queryFn: () => getUsersInfo([
      ...new Set([
        // Filter out non userId Actors like Stripe Webhooks
        ...serverRegistration.history.filter((e) => !Number.isNaN(e.actor_user_id)).map((e) => e.actor_user_id),
      ]),
    ]),
    enabled: Boolean(serverRegistration),
  });

  const { mutate: updateRegistrationMutation, isLoading: isUpdating } = useMutation({
    mutationFn: updateRegistration,
    onError: (data) => {
      const { errorCode } = data;
      dispatch(setMessage(
        errorCode
          ? `competitions.registration_v2.errors.${errorCode}`
          : 'registrations.flash.failed',
        'negative',
      ));
    },
    onSuccess: (data) => {
      setMessage(setMessage('Registration update succeeded', 'positive'));
      queryClient.setQueryData(
        ['registration', competitionInfo.id, competitor.id],
        data,
      );
    },
  });

  useEffect(() => {
    if (serverRegistration) {
      setRegistration(serverRegistration);
      setComment(serverRegistration.competing.comment ?? '');
      setStatus(serverRegistration.competing.registration_status);
      setSelectedEvents(serverRegistration.competing.event_ids);
      setAdminComment(serverRegistration.competing.admin_comment ?? '');
      setWaitingListPosition(
        serverRegistration.competing.waiting_list_position ?? 0,
      );
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
  const hasGuestsChanged = false;

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
      dispatch(setMessage('There are no changes', 'basic'));
    } else if (!commentIsValid) {
      dispatch(setMessage('You must include a comment', 'negative'));
    } else if (!eventsAreValid) {
      dispatch(setMessage(
        maxEvents === Infinity
          ? 'You must select at least 1 event'
          : `You must select between 1 and ${maxEvents} events`,
        'negative',
      ));
    } else {
      dispatch(setMessage('Updating Registration', 'basic'));
      updateRegistrationMutation({
        user_id: competitor.id,
        competing: {
          status,
          event_ids: selectedEvents,
          comment,
          admin_comment: adminComment,
          waiting_list_position: waitingListPosition,
        },
        competition_id: competitionInfo.id,
      });
    }
  }, [hasChanges,
    commentIsValid,
    eventsAreValid, dispatch, maxEvents,
    updateRegistrationMutation, competitor,
    status, selectedEvents, comment,
    adminComment, waitingListPosition, competitionInfo.id]);

  const registrationEditDeadlinePassed = Boolean(competitionInfo.event_change_deadline_date)
    && hasPassed(competitionInfo.event_change_deadline_date);

  return (
    <Segment padded attached>
      {!registration?.competing?.registration_status || isLoading ? (
        <Loading />
      ) : (
        <Form onSubmit={handleRegisterClick}>
          {!competitor.wca_id && (
            <Message>
              This person registered with an account. You can edit their
              personal information
              {' '}
              <a href={editPersonUrl(competitor.id)}>here.</a>
            </Message>
          )}
          <Header>{competitor.name}</Header>
          <EventSelector
            onEventSelection={setSelectedEvents}
            selectedEvents={selectedEvents}
            disabled={registrationEditDeadlinePassed}
            eventList={competitionInfo.event_ids}
          />
          <label>Comment</label>
          <Form.TextArea
            id="competitor-comment"
            maxLength={240}
            value={comment}
            disabled={registrationEditDeadlinePassed}
            onChange={(event, data) => {
              setComment(data.value);
            }}
          />

          <label>Administrative Notes</label>
          <Form.TextArea
            id="admin-comment"
            maxLength={240}
            value={adminComment}
            disabled={registrationEditDeadlinePassed}
            onChange={(event, data) => {
              setAdminComment(data.value);
            }}
          />

          <Form.Group inline>
            <label>Status</label>
            <Form.Checkbox
              radio
              label="Pending"
              name="checkboxRadioGroup"
              value="pending"
              checked={status === 'pending'}
              disabled={registrationEditDeadlinePassed}
              onChange={(event, data) => setStatus(data.value)}
            />
            <Form.Checkbox
              radio
              label="Accepted"
              name="checkboxRadioGroup"
              value="accepted"
              checked={status === 'accepted'}
              disabled={registrationEditDeadlinePassed}
              onChange={(event, data) => setStatus(data.value)}
            />
            <Form.Checkbox
              radio
              label="Waiting List"
              name="checkboxRadioGroup"
              value="waiting_list"
              checked={status === 'waiting_list'}
              disabled={registrationEditDeadlinePassed}
              onChange={(event, data) => setStatus(data.value)}
            />
            <Form.Checkbox
              radio
              label="Cancelled"
              name="checkboxRadioGroup"
              value="cancelled"
              disabled={registrationEditDeadlinePassed}
              checked={status === 'cancelled'}
              onChange={(event, data) => setStatus(data.value)}
            />
          </Form.Group>
          <label>Guests</label>
          <Form.Input
            disabled={registrationEditDeadlinePassed}
            type="number"
            min={0}
            max={99}
            value={guests}
            onChange={(event, data) => setGuests(data.value)}
          />

          {registrationEditDeadlinePassed ? (
            <Message negative>Registration edit deadline has passed.</Message>
          ) : (
            <Button
              color="blue"
              disabled={isUpdating}
            >
              Update Registration
            </Button>
          )}

          {competitionInfo['using_payment_integrations?'] && (
            <>
              <Header>
                Payment status:
                {' '}
                {registration.payment.payment_status}
              </Header>
              {(registration.payment.payment_status === 'succeeded' || registration.payment.payment_status === 'refund') && (
                <Refunds
                  competitionId={competitionInfo.id}
                  userId={competitor.id}
                />
              )}
            </>
          )}
          <Header>Registration History</Header>
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Timestamp</Table.HeaderCell>
                <Table.HeaderCell>Changes</Table.HeaderCell>
                <Table.HeaderCell>Acting User</Table.HeaderCell>
                <Table.HeaderCell>Action</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {registration.history.map((entry) => (
                <Table.Row key={entry.timestamp}>
                  <Table.Cell>
                    <Popup
                      content={getShortTimeString(entry.timestamp)}
                      trigger={
                        <span>{getShortDateString(entry.timestamp)}</span>
                          }
                    />
                  </Table.Cell>
                  <Table.Cell>
                    {!_.isEmpty(entry.changed_attributes) ? (
                      Object.entries(entry.changed_attributes).map(
                        ([k, v]) => (
                          <span key={k}>
                            Changed
                            {' '}
                            {k}
                            {' '}
                            to
                            {' '}
                            {JSON.stringify(v)}
                            {' '}
                            <br />
                          </span>
                        ),
                      )
                    ) : (
                      <span>Registration Created</span>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    {
                          competitorsInfo.find(
                            (c) => c.id === entry.actor_user_id,
                          )?.name ?? entry.actor_user_id
                        }
                  </Table.Cell>
                  <Table.Cell>{entry.action}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Form>
      )}
    </Segment>
  );
}
