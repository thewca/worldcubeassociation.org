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
import { useStepNavigation } from '../lib/StepNavigationProvider';

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

const getName = (eventId) => events.byId[eventId].name;

function getUpdateMessage(
  hasCommentChanged,
  comment,
  originalEventIds,
  selectedEventIds,
  hasGuestsChanged,
  guests,
) {
  const addedEventIds = selectedEventIds.filter((id) => !originalEventIds.includes(id));
  const removedEventIds = originalEventIds.filter((id) => !selectedEventIds.includes(id));
  const hasEventsChanged = (addedEventIds.length + removedEventIds.length) > 0;

  return `\n${
    hasCommentChanged ? `Updated Comment: ${comment}\n` : ''
  }${
    addedEventIds.length ? `Added Events: ${addedEventIds.map(getName).join(', ')}\n` : ''
  }${
    removedEventIds.length ? `Removed Events: ${removedEventIds.map(getName).join(', ')}\n` : ''
  }${
    hasEventsChanged ? `Updated Event List: ${selectedEventIds.map(getName).join(', ')}\n` : ''
  }${
    hasGuestsChanged ? `Updated Guests: ${guests}\n` : ''
  }`;
}

export default function CompetingStep({
  competitionInfo,
  user,
}) {
  const {
    nextStep,
    jumpToSummary,
    currentStep: { parameters: currentStepParameters },
  } = useStepNavigation();

  const maxEvents = currentStepParameters.events_per_registration_limit ?? Infinity;

  const {
    isRegistered, isPolling, isProcessing, startPolling, refetchRegistration,
    isPending, isWaitingList, registration, registrationId,
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

  const formSuccess = useFormSuccessHandler();

  useEffect(() => {
    if (isPolling && !isProcessing) {
      refetchRegistration().then((serverRegistration) => {
        formSuccess(serverRegistration, true);
        nextStep();
      });
    }
  }, [
    isPolling,
    isProcessing,
    refetchRegistration,
    formSuccess,
    nextStep,
  ]);

  const {
    mutate: updateRegistrationMutation,
    isPending: isUpdating,
  } = useUpdateRegistrationMutation(competitionInfo, user, 'basic');

  const onUpdateSuccess = useCallback((data) => {
    formSuccess(data.registration, true);
    jumpToSummary();
  }, [formSuccess, jumpToSummary]);

  const onRegistrationError = useRegistrationMutationErrorHandler();

  const { mutate: createRegistrationMutation, isLoading: isCreating } = useMutation({
    mutationFn: submitEventRegistration,
    onError: onRegistrationError,
    onSuccess: () => {
      // We can't update the registration yet, because there might be more steps needed
      // And the Registration might still be processing
      dispatch(showMessage('registrations.flash.registered', 'positive'));
      startPolling();
    },
  });

  const hasEventsChanged = useHasFormValueChanged('event_ids', ['competing']);
  const hasCommentChanged = useHasFormValueChanged('comment', ['competing']);
  const hasGuestsChanged = useHasFormValueChanged('guests');

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
      competitionId: competitionInfo.id,
      payload: {
        ...formState,
        user_id: user.id,
        competition_id: competitionInfo.id,
      },
    });
  }, [
    createRegistrationMutation,
    formState,
    user.id,
    competitionInfo.id,
  ]);

  const canEditRegistration = useMemo(() => (
    currentStepParameters.allow_registration_edits || isPending || isWaitingList
  ), [currentStepParameters.allow_registration_edits, isPending, isWaitingList]);

  const actionUpdateRegistration = useCallback(() => {
    confirm({
      content: I18n.t(canEditRegistration ? 'competitions.registration_v2.update.update_confirm' : 'competitions.registration_v2.update.update_confirm_contact'),
    }).then(() => {
      if (canEditRegistration) {
        updateRegistrationMutation({
          registrationId,
          payload: {
            competing: {
              comment: hasCommentChanged ? comment : undefined,
              event_ids: hasEventsChanged ? selectedEventIds.asArray : undefined,
            },
            guests: hasGuestsChanged ? guests : undefined,
          },
        }, {
          onSuccess: (data, variables) => {
            onUpdateSuccess(data);

            const newCompetingStatus = variables.payload.competing?.registration_status
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
        const updateMessage = getUpdateMessage(
          hasCommentChanged,
          comment,
          registration?.competing?.event_ids ?? [],
          selectedEventIds.asArray,
          hasGuestsChanged,
          guests,
        );
        window.location = contactCompetitionUrl(competitionInfo.id, encodeURIComponent(I18n.t('competitions.registration_v2.update.update_contact_message', { update_params: updateMessage })));
      }
    }).catch(() => {
      nextStep();
    });
  }, [
    confirm,
    dispatch,
    updateRegistrationMutation,
    competitionInfo,
    registrationId,
    hasCommentChanged,
    comment,
    hasEventsChanged,
    registration?.competing?.event_ids,
    selectedEventIds.asArray,
    hasGuestsChanged,
    guests,
    initialRegistrationStatus,
    onUpdateSuccess,
    canEditRegistration,
    nextStep,
  ]);

  const actionReRegister = useCallback(() => {
    updateRegistrationMutation({
      registrationId,
      payload: {
        ...formState,
        competing: {
          ...formState.competing,
          status: 'pending',
        },
      },
    }, { onSuccess: onUpdateSuccess });
  }, [
    updateRegistrationMutation,
    formState,
    registrationId,
    onUpdateSuccess,
  ]);

  const onEventClick = (eventId) => {
    selectedEventIds.toggle(eventId);
    setHasInteracted(true);
  };

  const onAllEventsClick = () => {
    if (currentStepParameters['uses_qualification?']) {
      selectedEventIds.update(
        currentStepParameters.event_ids.filter((e) => isQualifiedForEvent(
          e,
          currentStepParameters.qualification_wcif,
          currentStepParameters.personalRecords,
        )),
      );
    } else {
      selectedEventIds.update(currentStepParameters.event_ids);
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

  const guestsRestricted = currentStepParameters.guest_entry_status === 'restricted';
  const guestLimit = currentStepParameters.guests_per_registration_limit !== null
  && guestsRestricted
    ? currentStepParameters.guests_per_registration_limit
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

      <Form onSubmit={handleSubmit} warning={formWarnings.length > 0} size="large">
        <Message
          warning
          list={formWarnings}
        />
        <Form.Field required error={hasInteracted && selectedEventIds.size === 0}>
          <EventSelector
            id="event-selection"
            eventList={currentStepParameters.event_ids}
            selectedEvents={selectedEventIds.asArray}
            onEventClick={onEventClick}
            onAllClick={onAllEventsClick}
            onClearClick={onClearEventsClick}
            maxEvents={maxEvents}
            eventsDisabled={
                currentStepParameters.allow_registration_without_qualification
                  ? []
                  : eventsNotQualifiedFor(
                    currentStepParameters.event_ids,
                    currentStepParameters.qualification_wcif,
                    currentStepParameters.personalRecords,
                  )
              }
            disabledText={(event) => eventQualificationToString(
              { id: event },
              currentStepParameters.qualification_wcif[event],
              { short: true },
            )}
              // Don't error if the user hasn't interacted with the form yet
            shouldErrorOnEmpty={hasInteracted}
          />
          {!currentStepParameters.events_per_registration_limit
              && (
                <I18nHTMLTranslate
                  options={{
                    link: `<a href="${userPreferencesRoute}">here</a>`,
                  }}
                  i18nKey="registrations.preferred_events_prompt_html"
                />
              )}
        </Form.Field>
        <Form.Field required={Boolean(currentStepParameters.force_comment_in_registration)}>
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
            required={Boolean(currentStepParameters.force_comment_in_registration)}
            maxLength={maxCommentLength}
            onChange={setComment}
            value={comment}
            id="comment"
            error={currentStepParameters.force_comment_in_registration && comment.trim().length === 0 && I18n.t('registrations.errors.cannot_register_without_comment')}
          />
        </Form.Field>
        {currentStepParameters.guests_enabled && (
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
                <Button secondary onClick={nextStep}>
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
    </Segment>
  );
}
