import React, { useMemo } from 'react';
import {
  InputBoolean,
  InputBooleanSelect,
  InputDate,
  InputMarkdown,
  InputNumber,
  InputRadio,
  InputSelect,
} from '../../wca/FormBuilder/input/FormInputs';
import ConditionalSection from './ConditionalSection';
import I18n from '../../../lib/i18n';
import SubSection from '../../wca/FormBuilder/SubSection';
import {
  useFormInitialObject,
  useFormObject,
} from '../../wca/FormBuilder/provider/FormObjectProvider';
import { hasNotPassed } from '../../../lib/utils/dates';

const guestsEnabledOptions = [true, false].map((bool) => ({
  value: bool,
  text: I18n.t(`competitions.competition_form.choices.guests_enabled.${bool.toString()}`),
}));

const guestMessageOptions = ['unclear', 'free', 'restricted'].map((status) => ({
  key: status,
  value: status,
  text: I18n.t(`competitions.competition_form.choices.registration.guest_entry_status.${status}`),
}));

const canCancelOptions = ['not_accepted', 'always', 'unpaid'].map((status) => ({
  key: status,
  value: status,
  text: I18n.t(`competitions.competition_form.choices.registration.competitor_can_cancel.${status}`),
}));

export default function RegistrationDetails() {
  const { entryFees, registration } = useFormObject();

  const {
    registration: {
      waitingListDeadlineDate: originalWaitingListDeadlineDate,
      eventChangeDeadlineDate: originalEventChangeDeadlineDate,
    },
  } = useFormInitialObject();

  const guestsGoFree = entryFees?.guestEntryFee === 0;
  const guestsRestricted = guestsGoFree && registration?.guestEntryStatus === 'restricted';

  const waitingListNotYetPast = useMemo(
    () => originalWaitingListDeadlineDate === null || hasNotPassed(originalWaitingListDeadlineDate, 'UTC'),
    [originalWaitingListDeadlineDate],
  );

  const eventChangeNotYetPast = useMemo(
    () => originalEventChangeDeadlineDate === null || hasNotPassed(originalEventChangeDeadlineDate, 'UTC'),
    [originalEventChangeDeadlineDate],
  );

  return (
    <SubSection section="registration">
      <InputDate id="waitingListDeadlineDate" dateTime required ignoreDisabled={waitingListNotYetPast} />
      <InputDate id="eventChangeDeadlineDate" dateTime required ignoreDisabled={eventChangeNotYetPast} />
      <InputBooleanSelect id="allowOnTheSpot" required ignoreDisabled />
      <InputSelect id="competitorCanCancel" options={canCancelOptions} required ignoreDisabled />
      <InputBooleanSelect id="allowSelfEdits" required ignoreDisabled />
      <InputRadio id="guestsEnabled" options={guestsEnabledOptions} />
      <ConditionalSection showIf={guestsGoFree}>
        <InputSelect id="guestEntryStatus" options={guestMessageOptions} required={guestsGoFree} />
      </ConditionalSection>
      <ConditionalSection showIf={guestsRestricted}>
        <InputNumber id="guestsPerRegistration" required={guestsRestricted} />
      </ConditionalSection>
      <InputMarkdown id="extraRequirements" />
      <InputBoolean id="forceComment" ignoreDisabled />
    </SubSection>
  );
}
