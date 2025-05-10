import { useMutation } from '@tanstack/react-query';
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
import submitEventRegistration from '../api/registration/post/submit_registration';
import Processing from './Processing';
import { contactCompetitionUrl, userPreferencesRoute } from '../../../lib/requests/routes.js.erb';
import EventSelector from '../../wca/EventSelector';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import { showMessage } from './RegistrationMessage';
import I18n from '../../../lib/i18n';
import I18nHTMLTranslate from '../../I18nHTMLTranslate';
import { useConfirm } from '../../../lib/providers/ConfirmProvider';
import { events, defaultGuestLimit, WCA_EVENT_IDS } from '../../../lib/wca-data.js.erb';
import { eventsNotQualifiedFor, isQualifiedForEvent } from '../../../lib/helpers/qualifications';
import { eventQualificationToString } from '../../../lib/utils/wcif';
import { hasNotPassed } from '../../../lib/utils/dates';
import { useRegistration } from '../lib/RegistrationProvider';
import { useOrderedSetWrapper } from '../../../lib/hooks/useOrderedSet';
import {
  useFormInitialValue,
  useFormObject,
  useFormObjectState,
  useFormSuccessHandler,
  useHasFormValueChanged,
} from '../../wca/FormBuilder/provider/FormObjectProvider';
import { useInputUpdater } from '../../../lib/hooks/useInputState';
import { useRegistrationMutationErrorHandler, useUpdateRegistrationMutation } from '../lib/mutations';
import { isoMoneyToHumanReadable } from '../../../lib/helpers/money';

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
  qualifications,
}) {
  const {
    registration, isRegistered, hasPaid, isPolling, isProcessing, startPolling, refetchRegistration,
    isPending, isWaitingList,
  } = useRegistration();

  const dispatch = useDispatch();
  const confirm = useConfirm();

  const [comment, setCommentRaw] = useFormObjectState('comment', ['competing']);
  const setComment = useInputUpdater(setCommentRaw);

  const [nativeEventIds, setNativeEventIds] = useFormObjectState('event_ids', ['competing']);
  const selectedEventIds = useOrderedSetWrapper(nativeEventIds, setNativeEventIds, WCA_EVENT_IDS);

  const [guests, setGuestsRaw] = useFormObjectState('guests');
  const setGuests = useInputUpdater(setGuestsRaw, true);

  const initialRegistrationStatus = useFormInitialValue('status', ['competing']);

  const formState = useFormObject();

  // Don't set an error state before the user has interacted with the eventPicker
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (isPolling && !isProcessing) {
      refetchRegistration();
      nextStep();
    }
  }, [isPolling, isProcessing, nextStep, refetchRegistration]);

  const formSuccess = useFormSuccessHandler();

  const {
    mutate: updateRegistrationMutation,
    isPending: isUpdating,
  } = useUpdateRegistrationMutation(competitionInfo, user, 'basic');

  const onUpdateSuccess = useCallback((data) => {
    formSuccess(data.registration);
    nextStep();
  }, [formSuccess, nextStep]);

  const onRegistrationError = useRegistrationMutationErrorHandler();

  const { mutate: createRegistrationMutation, isLoading: isCreating } = useMutation({
    mutationFn: submitEventRegistration,
    onError: onRegistrationError,
    onSuccess: () => {
      // We can't update the registration yet, because there might be more steps needed
      // And the Registration might still be processing
      dispatch(showMessage('registrations.flash.registered', 'positive'));
      formSuccess();
      startPolling();
    },
  });

  const hasEventsChanged = useHasFormValueChanged('event_ids', ['competing']);
  const hasCommentChanged = useHasFormValueChanged('comment', ['competing']);
  const hasGuestsChanged = useHasFormValueChanged('guests');

  const hasChanges = hasEventsChanged || hasCommentChanged || hasGuestsChanged;

  const maxEvents = competitionInfo.events_per_registration_limit ?? Infinity;
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
      ...formState,
      user_id: user.id,
      competition_id: competitionInfo.id,
    });
  }, [
    createRegistrationMutation,
    formState,
    user.id,
    competitionInfo.id,
  ]);

  const canEditRegistration = useMemo(() => (
    competitionInfo.allow_registration_edits || isPending || isWaitingList
  ), [competitionInfo.allow_registration_edits, isPending, isWaitingList]);

  const actionUpdateRegistration = useCallback(() => {
    confirm({
      content: I18n.t(canEditRegistration ? 'competitions.registration_v2.update.update_confirm' : 'competitions.registration_v2.update.update_confirm_contact'),
    }).then(() => {
      if (canEditRegistration) {
        updateRegistrationMutation({
          user_id: user.id,
          competition_id: competitionInfo.id,
          competing: {
            comment: hasCommentChanged ? comment : undefined,
            event_ids: hasEventsChanged ? selectedEventIds.asArray : undefined,
          },
          guests: hasGuestsChanged ? guests : undefined,
        }, {
          onSuccess: (data, variables) => {
            onUpdateSuccess(data);

            const newCompetingStatus = variables.competing.registration_status
              || data.registration.competing.registration_status;

            if (initialRegistrationStatus === 'cancelled' && newCompetingStatus === 'pending') {
              // Going from cancelled -> pending
              // i18n-tasks-use t('registrations.flash.registered')
              dispatch(showMessage('registrations.flash.registered', 'positive'));
            } else {
              // Not changing status
              // i18n-tasks-use t('registrations.flash.updated')
              dispatch(showMessage('registrations.flash.updated', 'positive'));
            }
          },
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
    user,
    hasCommentChanged,
    comment,
    hasEventsChanged,
    selectedEventIds.asArray,
    hasGuestsChanged,
    guests,
    initialRegistrationStatus,
    onUpdateSuccess,
    canEditRegistration,
  ]);

  const actionReRegister = useCallback(() => {
    updateRegistrationMutation({
      ...formState,
      competing: {
        ...formState.competing,
        status: 'pending',
      },
      user_id: user.id,
      competition_id: competitionInfo.id,
    }, { onSuccess: onUpdateSuccess });
  }, [
    updateRegistrationMutation,
    formState,
    user.id,
    competitionInfo.id,
    onUpdateSuccess,
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

  const [competingStatus] = useFormObjectState('registration_status', ['competing']);

  const shouldShowReRegisterButton = competingStatus === 'cancelled';
  const shouldShowUpdateButton = isRegistered && !shouldShowReRegisterButton;

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
            {I18n.t('registrations.entry_fees_fully_paid', { paid: isoMoneyToHumanReadable(registration.payment.paid_amount_iso, registration.payment.currency_code) })}
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
              onChange={setComment}
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
                onChange={setGuests}
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
                  disabled={isUpdating || !hasChanges}
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
