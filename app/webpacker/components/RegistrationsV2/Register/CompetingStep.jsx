import { useMutation, useQueryClient } from '@tanstack/react-query';
import _ from 'lodash';
import React, {
  useCallback, useContext, useEffect, useState,
} from 'react';
import {
  Button,
  ButtonGroup,
  ButtonOr,
  Form,
  Icon,
  Input,
  Label,
  Message,
  Popup,
  Segment,
  TextArea,
} from 'semantic-ui-react';
import I18n from '../../../lib/i18n';
import { RegistrationContext } from '../Context/registration_context';
import updateRegistration from '../api/registration/patch/update_registration';
import submitEventRegistration from '../api/registration/post/submit_registration';
import { getMediumDateString, hasPassed } from '../lib/dates';
import setMessage from '../ui/events/messages';
import Processing from './Processing';
import { userPreferencesRoute } from '../../../lib/requests/routes.js.erb';
import { EventSelector } from '../../CompetitionsOverview/CompetitionsFilters';

const maxCommentLength = 240;

export default function CompetingStep({
  nextStep, competitionInfo, user, preferredEvents,
}) {
  const { registration, isRegistered, refetch } = useContext(RegistrationContext);

  const [comment, setComment] = useState('');
  const [selectedEvents, setSelectedEvents] = useState(
    preferredEvents.filter((event) => competitionInfo.event_ids.includes(event)),
  );
  const [guests, setGuests] = useState(0);

  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (isRegistered) {
      setComment(registration.competing.comment ?? '');
      setSelectedEvents(registration.competing.event_ids);
      setGuests(registration.guests);
    }
  }, [isRegistered, registration]);

  const queryClient = useQueryClient();
  const { mutate: updateRegistrationMutation, isLoading: isUpdating } = useMutation({
    mutationFn: updateRegistration,
    onError: (data) => {
      const { errorCode } = data;
      setMessage(
        errorCode
          ? I18n.t(`competitions.registration_v2.errors.${errorCode}`)
          : I18n.t('registrations.flash.failed') + data.message,
        'negative',
      );
    },
    onSuccess: (data) => {
      setMessage(I18n.t('registrations.flash.updated'), 'positive');
      queryClient.setQueryData(
        ['registration', competitionInfo.id, user.id],
        data.registration,
      );
    },
  });

  const { mutate: createRegistrationMutation, isLoading: isCreating } = useMutation({
    mutationFn: submitEventRegistration,
    onError: (data) => {
      const { errorCode } = data;
      setMessage(
        errorCode
          ? I18n.t(`competitions.registration_v2.errors.${errorCode}`)
          : I18n.t('competitions.registration_v2.register.error', {
            error: data.message,
          }),
        'negative',
      );
    },
    onSuccess: (_) => {
      // We can't update the registration yet, because there might be more steps needed
      // And the Registration might still be processing
      setMessage(I18n.t('registrations.flash.registered'), 'positive');
      setProcessing(true);
    },
  });

  const hasRegistrationEditDeadlinePassed = hasPassed(
    competitionInfo.event_change_deadline_date ?? competitionInfo.start_date,
  );
  const canUpdateRegistration = competitionInfo.allow_registration_edits
    && !hasRegistrationEditDeadlinePassed;

  const hasEventsChanged = registration?.competing
    && _.xor(registration.competing.event_ids, selectedEvents).length > 0;
  const hasCommentChanged = registration?.competing
    && comment !== (registration.competing.comment ?? '');
  const hasGuestsChanged = registration && guests !== registration.guests;

  const hasChanges = hasEventsChanged || hasCommentChanged || hasGuestsChanged;

  const commentIsValid = comment.trim() || !competitionInfo.force_comment_in_registration;
  const maxEvents = competitionInfo.events_per_registration_limit ?? Infinity;
  const eventsAreValid = selectedEvents.length > 0 && selectedEvents.length <= maxEvents;

  const attemptAction = useCallback(
    (action, options = {}) => {
      if (options.checkForChanges && !hasChanges) {
        setMessage(I18n.t('competitions.registration_v2.update.no_changes'), 'basic');
      } else if (!commentIsValid) {
        setMessage(
          I18n.t('registrations.errors.cannot_register_without_comment'),
          'negative',
        );
      } else if (!eventsAreValid) {
        setMessage(
          maxEvents === Infinity
            ? I18n.t('registrations.errors.must_register')
            : I18n.t('registrations.errors.exceeds_event_limit.other'),
          'negative',
        );
      } else {
        action();
      }
    },
    [commentIsValid, eventsAreValid, hasChanges, maxEvents],
  );

  const actionCreateRegistration = () => {
    setMessage('Registration is being processed', 'basic');
    createRegistrationMutation({
      user_id: user.id,
      competition_id: competitionInfo.id,
      competing: {
        event_ids: selectedEvents,
        comment,
      },
      guests,
    });
  };

  const actionUpdateRegistration = () => {
    setMessage('Registration is being updated', 'basic');
    updateRegistrationMutation({
      user_id: registration.user_id,
      competition_id: competitionInfo.id,
      competing: {
        comment: hasCommentChanged ? comment : undefined,
        event_ids: hasEventsChanged ? selectedEvents : undefined,
      },
      guests,
    });
  };

  const actionReRegister = () => {
    setMessage('Registration is being updated', 'basic');
    updateRegistrationMutation({
      user_id: registration.user_id,
      competition_id: competitionInfo.id,
      competing: {
        comment,
        guests,
        event_ids: selectedEvents,
        status: 'pending',
      },
    });
  };

  const actionDeleteRegistration = () => {
    setMessage('Registration is being deleted', 'basic');
    updateRegistrationMutation({
      user_id: registration.user_id,
      competition_id: competitionInfo.id,
      competing: {
        status: 'cancelled',
      },
    });
  };

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

  const shouldShowUpdateButton = isRegistered
    && !hasRegistrationEditDeadlinePassed
    && registration.competing.registration_status !== 'cancelled';

  const shouldShowReRegisterButton = registration?.competing?.registration_status === 'cancelled';

  const shouldShowDeleteButton = isRegistered
    && registration.competing.registration_status !== 'cancelled'
    && (registration.competing.registration_status !== 'accepted'
      || competitionInfo.allow_registration_self_delete_after_acceptance)
    && competitionInfo['registration_opened?'];

  return (
    <Segment basic>
      {processing && (
        <Processing
          competitionInfo={competitionInfo}
          user={user}
          onProcessingComplete={() => {
            setProcessing(false);
            if (competitionInfo['using_stripe_payments?']) {
              nextStep();
            } else {
              refetch();
            }
          }}
        />
      )}

      <>
        {isRegistered && (
          <Message info>
            You have registered for
            {competitionInfo.name}
          </Message>
        )}
        {!competitionInfo['registration_opened?'] && (
          <Message warning>
            {I18n.t('competitions.registration_v2.register.early_registration')}
          </Message>
        )}

        <Form>
          <Form.Field>
            <EventSelector
              onEventSelection={handleEventSelection}
              eventList={competitionInfo.event_ids}
              selectedEvents={selectedEvents}
              id="event-selection"
            />
            <p
              dangerouslySetInnerHTML={{
                __html: I18n.t('registrations.preferred_events_prompt_html', {
                  link: `<a href="${userPreferencesRoute}">here</a>`,
                }),
              }}
            />
          </Form.Field>
          <Form.Field required={competitionInfo.force_comment_in_registration}>
            <label htmlFor="comment">
              {I18n.t('competitions.registration_v2.register.comment')}
            </label>
            <TextArea
              maxLength={maxCommentLength}
              onChange={(_, data) => setComment(data.value)}
              value={comment}
              placeholder={
                competitionInfo.force_comment_in_registration
                  ? I18n.t('registrations.errors.cannot_register_without_comment')
                  : ''
              }
              id="comment"
            />
            <p>
              {comment.length}
              /
              {maxCommentLength}
            </p>
          </Form.Field>
          <Form.Field>
            <Input
              id="guest-dropdown"
              type="number"
              value={guests}
              onChange={(_, data) => {
                setGuests(Number.parseInt(data.value, 10));
              }}
              min="0"
              label={<Label>Guests</Label>}
              max={competitionInfo.guests_per_registration_limit ?? 10}
            />
          </Form.Field>
        </Form>

        {isRegistered ? (
          <>
            <Message warning icon>
              <Popup
                trigger={<Icon name="circle info" />}
                position="top center"
                content={
                  canUpdateRegistration
                    ? I18n.t('competitions.registration_v2.register.until', {
                      date: getMediumDateString(
                        competitionInfo.event_change_deadline_date
                        ?? competitionInfo.start_date,
                      ),
                    })
                    : I18n.t('competitions.registration_v2.register.passed')
                }
              />
              <Message.Content>
                <Message.Header>
                  {I18n.t(
                    'competitions.registration_v2.register.registration_status.header',
                  )}
                  {I18n.t(
                    `simple_form.options.registration.status.${registration.competing.registration_status}`,
                  )}
                </Message.Header>
                {/* eslint-disable-next-line no-nested-ternary */}
                {canUpdateRegistration
                  ? I18n.t('registrations.update')
                  : hasRegistrationEditDeadlinePassed
                    ? I18n.t('competitions.registration_v2.errors.-4001')
                    : I18n.t(
                      'competitions.registration_v2.register.editing_disabled',
                    )}
              </Message.Content>
            </Message>

            <ButtonGroup widths={2}>
              {shouldShowUpdateButton && (
                <>
                  <Button
                    primary
                    disabled={
                      isUpdating || !canUpdateRegistration || !hasChanges
                    }
                    onClick={() => attemptAction(actionUpdateRegistration, {
                      checkForChanges: true,
                    })}
                  >
                    {I18n.t('registrations.update')}
                  </Button>
                  <ButtonOr />
                </>
              )}

              {shouldShowReRegisterButton && (
                <Button
                  secondary
                  disabled={isUpdating}
                  onClick={() => attemptAction(actionReRegister)}
                >
                  Re-Register
                </Button>
              )}

              {shouldShowDeleteButton && (
                <Button
                  disabled={isUpdating}
                  negative
                  onClick={actionDeleteRegistration}
                >
                  {I18n.t('registrations.delete_registration')}
                </Button>
              )}
            </ButtonGroup>
          </>
        ) : (
          <>
            <Message info icon floating>
              <Popup
                content={I18n.t('registrations.mailer.new.awaits_approval')}
                position="top left"
                trigger={<Icon name="circle info" />}
              />
              <Message.Content>
                {I18n.t('competitions.registration_v2.register.disclaimer')}
              </Message.Content>
            </Message>

            <Button
              positive
              fluid
              icon
              labelPosition="left"
              disabled={isCreating}
              onClick={() => attemptAction(actionCreateRegistration)}
            >
              <Icon name="paper plane" />
              {I18n.t('registrations.register')}
            </Button>
          </>
        )}
      </>
    </Segment>
  );
}
