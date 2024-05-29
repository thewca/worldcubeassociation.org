import { useMutation, useQueryClient } from '@tanstack/react-query';
import _ from 'lodash';
import React, {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import {
  Button,
  ButtonGroup,
  ButtonOr,
  Form,
  Icon,
  Message,
  Popup,
  Segment,
} from 'semantic-ui-react';
import updateRegistration from '../api/registration/patch/update_registration';
import submitEventRegistration from '../api/registration/post/submit_registration';
import Processing from './Processing';
import { userPreferencesRoute } from '../../../lib/requests/routes.js.erb';
import { EventSelector } from '../../CompetitionsOverview/CompetitionsFilters';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import { setMessage } from './RegistrationMessage';
import i18n from '../../../lib/i18n';
import I18nHTMLTranslate from '../../I18nHTMLTranslate';

const maxCommentLength = 240;

const potentialWarnings = (competitionInfo) => {
  const warnings = [];
  // Organizer Pre Registration
  if (!competitionInfo['registration_opened?']) {
    warnings.push(i18n.t('competitions.registration_v2.register.early_registration'));
  }
  // Favourites Competition
  if (competitionInfo.events_per_registration_limit) {
    warnings.push(i18n.t('competitions.registration_v2.register.event_limit', {
      max_events: competitionInfo.events_per_registration_limit,
    }));
  }
  return warnings;
};

export default function CompetingStep({
  nextStep,
  competitionInfo,
  user,
  preferredEvents,
  registration,
  refetchRegistration,
}) {
  const maxEvents = competitionInfo.events_per_registration_limit ?? Infinity;
  const isRegistered = Boolean(registration);
  const hasPaid = registration?.payment.payment_status === 'succeeded';
  const dispatch = useDispatch();

  const [comment, setComment] = useState('');
  const [selectedEvents, setSelectedEvents] = useState(
    competitionInfo.events_per_registration_limit ? [] : preferredEvents
      .filter((event) => competitionInfo.event_ids.includes(event)),
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
      const { error } = data.json;
      dispatch(setMessage(
        error
          ? `competitions.registration_v2.errors.${error}`
          : 'registrations.flash.failed',
        'negative',
      ));
    },
    onSuccess: (data) => {
      dispatch(setMessage('registrations.flash.updated', 'positive'));
      queryClient.setQueryData(
        ['registration', competitionInfo.id, user.id],
        {
          ...data.registration,
          payment: registration.payment,
        },
      );
      nextStep();
    },
  });

  const { mutate: createRegistrationMutation, isLoading: isCreating } = useMutation({
    mutationFn: submitEventRegistration,
    onError: (data) => {
      const { error } = data.json;
      dispatch(setMessage(
        error
          ? `competitions.registration_v2.errors.${error}`
          : 'registrations.flash.failed',
        'negative',
      ));
    },
    onSuccess: () => {
      // We can't update the registration yet, because there might be more steps needed
      // And the Registration might still be processing
      dispatch(setMessage('registrations.flash.registered', 'positive'));
      setProcessing(true);
    },
  });

  const hasEventsChanged = registration?.competing
    && _.xor(registration.competing.event_ids, selectedEvents).length > 0;
  const hasCommentChanged = registration?.competing
    && comment !== (registration.competing.comment ?? '');
  const hasGuestsChanged = registration && guests !== registration.guests;

  const hasChanges = hasEventsChanged || hasCommentChanged || hasGuestsChanged;

  const eventsAreValid = selectedEvents.length > 0 && selectedEvents.length <= maxEvents;

  const attemptAction = useCallback(
    (action, options = {}) => {
      if (options.checkForChanges && !hasChanges) {
        dispatch(setMessage('competitions.registration_v2.update.no_changes', 'basic'));
      } else if (!eventsAreValid) {
        dispatch(setMessage(
          maxEvents === Infinity
            ? 'registrations.errors.must_register'
            : 'registrations.errors.exceeds_event_limit.other',
          'negative',
          {
            event_limit: maxEvents,
          },
        ));
      } else {
        action();
      }
    },
    [dispatch, eventsAreValid, hasChanges, maxEvents],
  );

  const actionCreateRegistration = () => {
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
    dispatch(setMessage('competitions.registration_v2.update.being_updated', 'basic'));
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
    dispatch(setMessage('competitions.registration_v2.update.being_updated', 'basic'));
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
    dispatch(setMessage('competitions.registration_v2.update.being_deleted', 'basic'));
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
    && registration.competing.registration_status !== 'cancelled';

  const shouldShowReRegisterButton = registration?.competing?.registration_status === 'cancelled';

  const shouldShowDeleteButton = isRegistered
    && registration.competing.registration_status !== 'cancelled'
    && (registration.competing.registration_status !== 'accepted'
      || competitionInfo.allow_registration_self_delete_after_acceptance)
    && competitionInfo['registration_opened?'];

  const handleSubmit = useCallback((event) => {
    event.preventDefault();
    if (shouldShowUpdateButton) {
      attemptAction(actionUpdateRegistration, { checkForChanges: true });
    } else if (shouldShowReRegisterButton) {
      attemptAction(actionReRegister);
    } else {
      attemptAction(actionCreateRegistration);
    }
  }, [
    actionCreateRegistration,
    actionReRegister,
    actionUpdateRegistration,
    attemptAction,
    shouldShowReRegisterButton,
    shouldShowUpdateButton,
  ]);

  const formWarnings = useMemo(() => potentialWarnings(competitionInfo), [competitionInfo]);

  return (
    <Segment basic>
      {processing && (
        <Processing
          competitionInfo={competitionInfo}
          user={user}
          onProcessingComplete={async () => {
            setProcessing(false);
            if (competitionInfo['using_payment_integrations?']) {
              nextStep();
            } else {
              await refetchRegistration();
              nextStep();
            }
          }}
        />
      )}

      <>
        {hasPaid && (
          <Message success>
            {i18n.t('competitions.registration_v2.register.already_paid', { comp_name: competitionInfo.name })}
          </Message>
        )}

        <Form onSubmit={handleSubmit} warning={formWarnings.length > 0} size="large">
          <Message
            warning
            list={formWarnings}
          />
          <Form.Field required error={selectedEvents.length === 0}>
            <EventSelector
              onEventSelection={handleEventSelection}
              eventList={competitionInfo.event_ids}
              selectedEvents={selectedEvents}
              id="event-selection"
              maxEvents={maxEvents}
            />
            {!competitionInfo.events_per_registration_limit
              && (
                <I18nHTMLTranslate
                  options={{
                    link: `<a href="${userPreferencesRoute}">here</a>`,
                  }}
                  i18nKey="registrations.preferred_events_prompt_html"
                />
              )}
          </Form.Field>
          <Form.Field required={Boolean(competitionInfo.force_comment_in_registration)}>
            <label htmlFor="comment">
              {i18n.t('competitions.registration_v2.register.comment')}
            </label>
            <Form.TextArea
              required={Boolean(competitionInfo.force_comment_in_registration)}
              maxLength={maxCommentLength}
              onChange={(event, data) => setComment(data.value)}
              value={comment}
              id="comment"
              error={competitionInfo.force_comment_in_registration && comment.trim().length === 0 && i18n.t('registrations.errors.cannot_register_without_comment')}
            />
            <p>
              {comment.length}
              /
              {maxCommentLength}
            </p>
          </Form.Field>
          <Form.Field>
            <label>{i18n.t('activerecord.attributes.registration.guests')}</label>
            <Form.Input
              id="guest-dropdown"
              type="number"
              value={guests}
              onChange={(event, data) => {
                setGuests(Number.parseInt(data.value, 10));
              }}
              min="0"
              max={competitionInfo.guests_per_registration_limit}
              error={guests > competitionInfo.guests_per_registration_limit && i18n.t('competitions.competition_info.guest_limit', { count: competitionInfo.guests_per_registration_limit })}
            />
          </Form.Field>
          {isRegistered ? (
            <ButtonGroup widths={2}>
              {shouldShowUpdateButton && (
              <>
                <Button
                  primary
                  disabled={
                        isUpdating || !hasChanges
                      }
                  type="submit"
                >
                  {i18n.t('registrations.update')}
                </Button>
                <ButtonOr />
              </>
              )}

              {shouldShowReRegisterButton && (
              <Button
                secondary
                disabled={isUpdating}
                type="submit"
              >
                {i18n.t('registrations.register')}
              </Button>
              )}

              {shouldShowDeleteButton && (
              <Button
                disabled={isUpdating}
                negative
                onClick={() => attemptAction(actionDeleteRegistration)}
              >
                {i18n.t('registrations.delete_registration')}
              </Button>
              )}
            </ButtonGroup>
          ) : (
            <>
              <Message info icon floating>
                <Popup
                  content={i18n.t('registrations.mailer.new.awaits_approval')}
                  position="top left"
                  trigger={<Icon name="circle info" />}
                />
                <Message.Content>
                  {i18n.t('competitions.registration_v2.register.disclaimer')}
                </Message.Content>
              </Message>
              <Button
                positive
                fluid
                icon
                type="submit"
                labelPosition="left"
                disabled={isCreating}
              >
                <Icon name="paper plane" />
                {i18n.t('registrations.register')}
              </Button>
            </>
          )}
        </Form>
      </>
    </Segment>
  );
}
