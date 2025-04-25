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
import { contactCompetitionUrl, userPreferencesRoute } from '../../../lib/requests/routes.js.erb';
import EventSelector from '../../wca/EventSelector';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import { showMessage } from './RegistrationMessage';
import I18n from '../../../lib/i18n';
import I18nHTMLTranslate from '../../I18nHTMLTranslate';
import { useConfirm } from '../../../lib/providers/ConfirmProvider';
import { events, defaultGuestLimit } from '../../../lib/wca-data.js.erb';
import { eventsNotQualifiedFor, isQualifiedForEvent } from '../../../lib/helpers/qualifications';
import { eventQualificationToString } from '../../../lib/utils/wcif';
import { hasNotPassed } from '../../../lib/utils/dates';
import { useRegistration } from '../lib/RegistrationProvider';
import useSet from '../../../lib/hooks/useSet';

const maxCommentLength = 240;

const potentialWarnings = (competitionInfo) => {
  const warnings = [];
  // Organizer Pre Registration
  if (hasNotPassed(competitionInfo.registration_open)) {
    warnings.push(I18n.t('competitions.registration_v2.register.early_registration'));
  }
  // Favourites Competition
  if (competitionInfo.events_per_registration_limit) {
    warnings.push(I18n.t('competitions.registration_v2.register.event_limit', {
      max_events: competitionInfo.events_per_registration_limit,
    }));
  }
  // Series Competition
  if (competitionInfo['part_of_competition_series?']) {
    warnings.push(I18n.t('competitions.competition_info.part_of_a_series'));
  }
  return warnings;
};

export default function CompetingStep({
  nextStep,
  competitionInfo,
  user,
  preferredEvents,
  qualifications,
}) {
  const maxEvents = competitionInfo.events_per_registration_limit ?? Infinity;
  const {
    registration, isRegistered, hasPaid, isPolling, isProcessing, startPolling, refetchRegistration,
  } = useRegistration();
  const dispatch = useDispatch();

  const confirm = useConfirm();

  const [comment, setComment] = useState('');
  const initialSelectedEvents = competitionInfo.events_per_registration_limit ? [] : preferredEvents
    .filter((event) => {
      const preferredEventHeld = competitionInfo.event_ids.includes(event);
      if (competitionInfo['uses_qualification?']) {
        return preferredEventHeld
          && isQualifiedForEvent(event, qualifications.wcif, qualifications.personalRecords);
      }
      return preferredEventHeld;
    });
  const selectedEventIds = useSet(initialSelectedEvents);
  // Don't set an error state before the user has interacted with the eventPicker
  const [hasInteracted, setHasInteracted] = useState(false);

  const [guests, setGuests] = useState(0);

  // using selectedEventIds.update in dependency array causes warnings
  const { update: setSelectedEventIds } = selectedEventIds;

  useEffect(() => {
    if (isRegistered && registration.competing.registration_status !== 'cancelled') {
      setComment(registration.competing.comment ?? '');
      setSelectedEventIds(registration.competing.event_ids);
      setGuests(registration.guests);
    }
  }, [isRegistered, registration, setSelectedEventIds]);

  useEffect(() => {
    if (isPolling && !isProcessing) {
      refetchRegistration();
      nextStep();
    }
  }, [isPolling, isProcessing, nextStep, refetchRegistration]);

  const queryClient = useQueryClient();
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
        ['registration', competitionInfo.id, user.id],
        {
          ...data.registration,
          payment: registration.payment,
        },
      );
      // Going from cancelled -> pending
      if (registration.competing.registration_status === 'cancelled') {
        // i18n-tasks-use t('registrations.flash.registered')
        dispatch(showMessage('registrations.flash.registered', 'positive'));
        // Not changing status
      } else {
        // i18n-tasks-use t('registrations.flash.updated')
        dispatch(showMessage('registrations.flash.updated', 'positive'));
      }
      nextStep();
    },
  });

  const { mutate: createRegistrationMutation, isLoading: isCreating } = useMutation({
    mutationFn: submitEventRegistration,
    onError: (data) => {
      const { error } = data.json;
      dispatch(showMessage(
        `competitions.registration_v2.errors.${error}`,
        'negative',
      ));
    },
    onSuccess: () => {
      // We can't update the registration yet, because there might be more steps needed
      // And the Registration might still be processing
      dispatch(showMessage('registrations.flash.registered', 'positive'));
      startPolling();
    },
  });

  const hasEventsChanged = registration?.competing
    && _.xor(registration.competing.event_ids, selectedEventIds.asArray).length > 0;
  const hasCommentChanged = registration?.competing
    && comment !== (registration.competing.comment ?? '');
  const hasGuestsChanged = registration && guests !== registration.guests;

  const hasChanges = hasEventsChanged || hasCommentChanged || hasGuestsChanged;

  const eventsAreValid = selectedEventIds.size > 0 && selectedEventIds.size <= maxEvents;

  const attemptAction = useCallback(
    (action, options = {}) => {
      if (options.checkForChanges && !hasChanges) {
        dispatch(showMessage('competitions.registration_v2.update.no_changes', 'basic'));
      } else if (!eventsAreValid) {
        // i18n-tasks-use t('registrations.errors.exceeds_event_limit')
        dispatch(showMessage(
          maxEvents === Infinity
            ? 'registrations.errors.must_register'
            : 'registrations.errors.exceeds_event_limit.other',
          'negative',
          {
            count: maxEvents,
          },
        ));
      } else {
        action();
      }
    },
    [dispatch, eventsAreValid, hasChanges, maxEvents],
  );

  const actionCreateRegistration = useCallback(() => {
    createRegistrationMutation({
      user_id: user.id,
      competition_id: competitionInfo.id,
      competing: {
        event_ids: selectedEventIds.asArray,
        comment,
      },
      guests,
    });
  }, [
    createRegistrationMutation,
    user.id,
    competitionInfo.id,
    selectedEventIds.asArray,
    comment,
    guests,
  ]);

  const canEditRegistration = (competitionInfo, registration) => {
    return (
      competitionInfo.allow_registration_edits || ['pending', 'waiting_list'].includes(registration.competing.registration_status)
    );
  };


  const actionUpdateRegistration = useCallback(() => {
    confirm({
      content: I18n.t(canEditRegistration(competitionInfo, registration) ? 'competitions.registration_v2.update.update_confirm' : 'competitions.registration_v2.update.update_confirm_contact'),
    }).then(() => {
      if (canEditRegistration(competitionInfo, registration)) {
        dispatch(showMessage('competitions.registration_v2.update.being_updated', 'basic'));
        updateRegistrationMutation({
          user_id: registration.user_id,
          competition_id: competitionInfo.id,
          competing: {
            comment: hasCommentChanged ? comment : undefined,
            event_ids: hasEventsChanged ? selectedEventIds.asArray : undefined,
          },
          guests,
        });
      } else {
        const updateMessage = `\n${hasCommentChanged ? `Comment: ${comment}\n` : ''}${hasEventsChanged ? `Events: ${selectedEventIds.asArray.map((eventId) => events.byId[eventId].name).join(', ')}\n` : ''}${hasGuestsChanged ? `Guests: ${guests}\n` : ''}`;
        window.location = contactCompetitionUrl(competitionInfo.id, encodeURIComponent(I18n.t('competitions.registration_v2.update.update_contact_message', { update_params: updateMessage })));
      }
    }).catch(() => {
      nextStep();
    });
  }, [
    confirm,
    dispatch,
    nextStep,
    updateRegistrationMutation,
    competitionInfo,
    registration?.user_id,
    hasCommentChanged,
    comment,
    hasEventsChanged,
    selectedEventIds.asArray,
    hasGuestsChanged,
    guests,
  ]);

  const actionReRegister = useCallback(() => {
    updateRegistrationMutation({
      user_id: registration.user_id,
      competition_id: competitionInfo.id,
      competing: {
        comment,
        event_ids: selectedEventIds.asArray,
        status: 'pending',
      },
      guests,
    });
  }, [
    updateRegistrationMutation,
    registration?.user_id,
    competitionInfo.id,
    comment,
    selectedEventIds.asArray,
    guests,
  ]);

  const onEventClick = (eventId) => {
    selectedEventIds.toggle(eventId);
    setHasInteracted(true);
  };

  const onAllEventsClick = () => {
    if (competitionInfo['uses_qualification?']) {
      selectedEventIds.update(
        competitionInfo.event_ids.filter((e) => isQualifiedForEvent(
          e,
          qualifications.wcif,
          qualifications.personalRecords,
        )),
      );
    } else {
      selectedEventIds.update(competitionInfo.event_ids);
    }
    setHasInteracted(true);
  };

  const onClearEventsClick = () => {
    selectedEventIds.clear();
    setHasInteracted(true);
  };

  const shouldShowUpdateButton = isRegistered
    && registration.competing.registration_status !== 'cancelled';

  const shouldShowReRegisterButton = registration?.competing?.registration_status === 'cancelled';

  const handleSubmit = useCallback((event) => {
    event.preventDefault();
    if (shouldShowReRegisterButton) {
      return attemptAction(actionReRegister);
    }
    if (shouldShowUpdateButton) {
      return attemptAction(actionUpdateRegistration, { checkForChanges: true });
    }
    return attemptAction(actionCreateRegistration);
  }, [
    actionCreateRegistration,
    actionReRegister,
    actionUpdateRegistration,
    attemptAction,
    shouldShowReRegisterButton,
    shouldShowUpdateButton,
  ]);

  const guestsRestricted = competitionInfo.guest_entry_status === 'restricted';
  const guestLimit = competitionInfo.guests_per_registration_limit !== null && guestsRestricted
    ? competitionInfo.guests_per_registration_limit
    : defaultGuestLimit;

  const formWarnings = useMemo(() => potentialWarnings(competitionInfo), [competitionInfo]);
  return (
    <Segment basic loading={isUpdating}>
      {isPolling && (
        <Processing
          competitionInfo={competitionInfo}
          user={user}
        />
      )}

      <>
        {hasPaid && (
          <Message success>
            {I18n.t('registrations.entry_fees_fully_paid', { paid: registration?.payment.payment_amount_human_readable })}
          </Message>
        )}

        <Form onSubmit={handleSubmit} warning={formWarnings.length > 0} size="large">
          <Message
            warning
            list={formWarnings}
          />
          <Form.Field required error={hasInteracted && selectedEventIds.size === 0}>
            <EventSelector
              id="event-selection"
              eventList={competitionInfo.event_ids}
              selectedEvents={selectedEventIds.asArray}
              onEventClick={onEventClick}
              onAllClick={onAllEventsClick}
              onClearClick={onClearEventsClick}
              maxEvents={maxEvents}
              eventsDisabled={
                competitionInfo.allow_registration_without_qualification
                  ? []
                  : eventsNotQualifiedFor(
                    competitionInfo.event_ids,
                    qualifications.wcif,
                    qualifications.personalRecords,
                  )
              }
              disabledText={(event) => eventQualificationToString(
                { id: event },
                qualifications.wcif[event],
                { short: true },
              )}
              // Don't error if the user hasn't interacted with the form yet
              shouldErrorOnEmpty={hasInteracted}
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
              {I18n.t('competitions.registration_v2.register.comment')}
              {' '}
              <div style={{ float: 'right', fontSize: '0.8em' }}>
                <i>
                  (
                  {comment.length}
                  /
                  {maxCommentLength}
                  )
                </i>
              </div>
            </label>
            <Form.TextArea
              required={Boolean(competitionInfo.force_comment_in_registration)}
              maxLength={maxCommentLength}
              onChange={(event, data) => setComment(data.value)}
              value={comment}
              id="comment"
              error={competitionInfo.force_comment_in_registration && comment.trim().length === 0 && I18n.t('registrations.errors.cannot_register_without_comment')}
            />
          </Form.Field>
          {competitionInfo.guests_enabled && (
            <Form.Field>
              <label htmlFor="guest-dropdown">{I18n.t('activerecord.attributes.registration.guests')}</label>
              <Form.Input
                id="guest-dropdown"
                type="number"
                value={guests}
                onChange={(event, data) => {
                  setGuests(Number.parseInt(data.value, 10));
                }}
                min="0"
                max={guestLimit}
                error={guestsRestricted && guests > guestLimit && I18n.t('competitions.competition_info.guest_limit', { count: guestLimit })}
              />
            </Form.Field>
          )}
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
                  {I18n.t('registrations.update')}
                </Button>
                <ButtonOr />
                <Button secondary onClick={() => nextStep()}>
                  {I18n.t('competitions.registration_v2.register.view_registration')}
                </Button>
              </>
              )}

              {shouldShowReRegisterButton && (
              <Button
                primary
                disabled={isUpdating}
                type="submit"
              >
                {I18n.t('registrations.register')}
              </Button>
              )}
            </ButtonGroup>
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
                type="submit"
                labelPosition="left"
                disabled={isCreating}
              >
                <Icon name="paper plane" />
                {I18n.t('registrations.register')}
              </Button>
            </>
          )}
        </Form>
      </>
    </Segment>
  );
}
