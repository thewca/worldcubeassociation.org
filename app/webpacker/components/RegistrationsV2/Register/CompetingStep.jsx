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
import { EventSelector } from '../../CompetitionsOverview/CompetitionsFilters';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import { setMessage } from './RegistrationMessage';
import I18n from '../../../lib/i18n';
import I18nHTMLTranslate from '../../I18nHTMLTranslate';
import { useConfirm } from '../../../lib/providers/ConfirmProvider';
import { events } from '../../../lib/wca-data.js.erb';
import { eventsNotQualifiedFor, isQualifiedForEvent } from '../../../lib/helpers/qualifications';
import { eventQualificationToString } from '../../../lib/utils/wcif';
import { hasNotPassed } from '../../../lib/utils/dates';

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
  registration,
  refetchRegistration,
  qualifications,
}) {
  const maxEvents = competitionInfo.events_per_registration_limit ?? Infinity;
  const isRegistered = Boolean(registration);
  const hasPaid = registration?.payment?.has_paid;
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
  const [selectedEvents, setSelectedEvents] = useState(
    initialSelectedEvents,
  );
  // Don't set an error state before the user has interacted with the eventPicker
  const [hasInteracted, setHasInteracted] = useState(false);
  const [guests, setGuests] = useState(0);

  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (isRegistered && registration.competing.registration_status !== 'cancelled') {
      setComment(registration.competing.comment ?? '');
      setSelectedEvents(registration.competing.event_ids);
      setGuests(registration.guests);
    }
  }, [isRegistered, registration]);

  const queryClient = useQueryClient();
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
        ['registration', competitionInfo.id, user.id],
        {
          ...data.registration,
          payment: registration.payment,
        },
      );
      // Going from cancelled -> pending
      if (registration.competing.registration_status === 'cancelled') {
        // i18n-tasks-use t('registrations.flash.registered')
        dispatch(setMessage('registrations.flash.registered', 'positive'));
        // Not changing status
      } else {
        // i18n-tasks-use t('registrations.flash.updated')
        dispatch(setMessage('registrations.flash.updated', 'positive'));
      }
      nextStep();
    },
  });

  const { mutate: createRegistrationMutation, isLoading: isCreating } = useMutation({
    mutationFn: submitEventRegistration,
    onError: (data) => {
      const { error } = data.json;
      dispatch(setMessage(
        `competitions.registration_v2.errors.${error}`,
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
        // i18n-tasks-use t('registrations.errors.exceeds_event_limit')
        dispatch(setMessage(
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
    confirm({
      content: I18n.t(competitionInfo.allow_registration_edits ? 'competitions.registration_v2.update.update_confirm' : 'competitions.registration_v2.update.update_confirm_contact'),
    }).then(() => {
      if (competitionInfo.allow_registration_edits) {
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
      } else {
        const updateMessage = `\n${hasCommentChanged ? `Comment: ${comment}\n` : ''}${hasEventsChanged ? `Events: ${selectedEvents.map((eventId) => events.byId[eventId].name).join(', ')}\n` : ''}${hasGuestsChanged ? `Guests: ${guests}\n` : ''}`;
        window.location = contactCompetitionUrl(competitionInfo.id, encodeURIComponent(I18n.t('competitions.registration_v2.update.update_contact_message', { update_params: updateMessage })));
      }
    }).catch(() => {
      nextStep();
    });
  };

  const actionReRegister = () => {
    updateRegistrationMutation({
      user_id: registration.user_id,
      competition_id: competitionInfo.id,
      competing: {
        comment,
        event_ids: selectedEvents,
        status: 'pending',
      },
      guests,
    });
  };

  const handleEventSelection = ({ type, eventId }) => {
    if (type === 'select_all_events') {
      if (competitionInfo['uses_qualification?']) {
        setSelectedEvents(
          competitionInfo.event_ids.filter((e) => isQualifiedForEvent(
            e,
            qualifications.wcif,
            qualifications.personalRecords,
          )),
        );
      } else {
        setSelectedEvents(competitionInfo.event_ids);
      }
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
    attemptAction(actionCreateRegistration);
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
    <Segment basic loading={isUpdating}>
      {processing && (
        <Processing
          competitionInfo={competitionInfo}
          user={user}
          onProcessingComplete={async () => {
            setProcessing(false);
            await refetchRegistration();
            nextStep();
          }}
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
          <Form.Field required error={hasInteracted && selectedEvents.length === 0}>
            <EventSelector
              onEventSelection={handleEventSelection}
              eventList={competitionInfo.event_ids}
              selectedEvents={selectedEvents}
              id="event-selection"
              maxEvents={maxEvents}
              eventsDisabled={eventsNotQualifiedFor(
                competitionInfo.event_ids,
                qualifications.wcif,
                qualifications.personalRecords,
              )}
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
              <label>{I18n.t('activerecord.attributes.registration.guests')}</label>
              <Form.Input
                id="guest-dropdown"
                type="number"
                value={guests}
                onChange={(event, data) => {
                  setGuests(Number.parseInt(data.value, 10));
                }}
                min="0"
                max={competitionInfo.guests_per_registration_limit ?? 99}
                error={Number.isInteger(competitionInfo.guests_per_registration_limit) && guests > competitionInfo.guests_per_registration_limit && I18n.t('competitions.competition_info.guest_limit', { count: competitionInfo.guests_per_registration_limit })}
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
